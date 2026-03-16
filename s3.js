import { bucketName, s3Domain, itemsPerPage, hiddenFiles } from "./config.js";

// DOM references
const objectList = document.getElementById('object-list');
const breadcrumb = document.getElementById('breadcrumb');
const searchInput = document.getElementById('search');
const loading = document.getElementById('loading');
const errorAlert = document.getElementById('error');

// State
let allItems = [];
let currentPage = 1;
let currentPath = '';
let sortKey = 'name';
let sortAsc = true;

// File extension → Font Awesome icon class
const ICON_MAP = {
  jpg: 'fa-file-image', jpeg: 'fa-file-image', png: 'fa-file-image',
  gif: 'fa-file-image', svg: 'fa-file-image', webp: 'fa-file-image', ico: 'fa-file-image',
  pdf: 'fa-file-pdf',
  doc: 'fa-file-word', docx: 'fa-file-word',
  xls: 'fa-file-excel', xlsx: 'fa-file-excel',
  ppt: 'fa-file-powerpoint', pptx: 'fa-file-powerpoint',
  js: 'fa-file-code', ts: 'fa-file-code', html: 'fa-file-code', htm: 'fa-file-code',
  css: 'fa-file-code', json: 'fa-file-code', xml: 'fa-file-code',
  py: 'fa-file-code', rb: 'fa-file-code', go: 'fa-file-code', java: 'fa-file-code',
  sh: 'fa-file-code', bash: 'fa-file-code', yaml: 'fa-file-code', yml: 'fa-file-code',
  zip: 'fa-file-archive', tar: 'fa-file-archive', gz: 'fa-file-archive',
  bz2: 'fa-file-archive', rar: 'fa-file-archive', '7z': 'fa-file-archive',
  txt: 'fa-file-alt', md: 'fa-file-alt', csv: 'fa-file-alt', log: 'fa-file-alt',
  mp3: 'fa-file-audio', wav: 'fa-file-audio', flac: 'fa-file-audio', aac: 'fa-file-audio',
  mp4: 'fa-file-video', avi: 'fa-file-video', mkv: 'fa-file-video', mov: 'fa-file-video',
};

function getFileIcon(key) {
  const ext = key.split('.').pop().toLowerCase();
  return ICON_MAP[ext] || 'fa-file';
}

// Encode each path segment separately so slashes are preserved in S3 URLs
function encodeS3Key(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function isFolder(key) {
  return key.endsWith('/');
}

function createItemLink(key) {
  const link = document.createElement('a');
  const icon = document.createElement('i');
  const textSpan = document.createElement('span');

  if (isFolder(key)) {
    icon.className = 'fas fa-folder';
    textSpan.textContent = key.slice(0, -1).split('/').pop();
    link.href = '#';
    link.onclick = (e) => { e.preventDefault(); navigateTo(key); };
  } else {
    icon.className = `fas ${getFileIcon(key)}`;
    textSpan.textContent = key.split('/').pop();
    link.href = `https://${bucketName}.${s3Domain}/${encodeS3Key(key)}`;
    link.setAttribute('download', '');
  }

  link.appendChild(icon);
  link.appendChild(textSpan);
  return link;
}

function navigateTo(path, replace = false) {
  currentPage = 1;
  currentPath = path;
  searchInput.value = '';
  const url = path ? `?prefix=${encodeURIComponent(path)}` : location.pathname;
  if (replace) {
    history.replaceState({ path }, '', url);
  } else {
    history.pushState({ path }, '', url);
  }
  listObjects(path);
}

function updateBreadcrumb(path) {
  const parts = path.split('/').filter(Boolean);
  let crumbPath = '';

  breadcrumb.innerHTML = '';

  const homeItem = document.createElement('li');
  homeItem.className = 'breadcrumb-item';
  const homeLink = document.createElement('a');
  homeLink.href = '#';
  homeLink.textContent = 'Home';
  homeLink.onclick = (e) => { e.preventDefault(); navigateTo(''); };
  homeItem.appendChild(homeLink);
  breadcrumb.appendChild(homeItem);

  parts.forEach((part, index) => {
    crumbPath += part + '/';
    const listItem = document.createElement('li');
    listItem.className = 'breadcrumb-item';

    if (index === parts.length - 1) {
      listItem.textContent = part;
      listItem.classList.add('active');
    } else {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = part;
      const thisCrumbPath = crumbPath;
      link.onclick = (e) => { e.preventDefault(); navigateTo(thisCrumbPath); };
      listItem.appendChild(link);
    }

    breadcrumb.appendChild(listItem);
  });
}

function formatSize(size) {
  if (isNaN(size)) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    // Folders always sort above files
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    let cmp = 0;
    if (sortKey === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === 'date') {
      cmp = (a.lastModified?.getTime() ?? 0) - (b.lastModified?.getTime() ?? 0);
    } else if (sortKey === 'size') {
      cmp = (isNaN(a.size) ? 0 : a.size) - (isNaN(b.size) ? 0 : b.size);
    }
    return sortAsc ? cmp : -cmp;
  });
}

function renderItems() {
  const sorted = sortItems(allItems);
  const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = sorted.slice(startIndex, startIndex + itemsPerPage);

  objectList.innerHTML = '';

  if (allItems.length === 0) {
    const row = objectList.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 3;
    cell.className = 'empty-cell';
    cell.textContent = 'This folder is empty.';
  } else {
    pageItems.forEach((item) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      nameCell.appendChild(createItemLink(item.key));
      row.appendChild(nameCell);
      row.insertCell().textContent = item.lastModified ? item.lastModified.toLocaleString() : '';
      row.insertCell().textContent = item.isFolder ? '' : formatSize(item.size);
      objectList.appendChild(row);
    });
  }

  updatePaginationControls(totalPages);
  updateSortIndicators();
}

function parseXML(xmlDoc, path) {
  const items = [];

  Array.from(xmlDoc.getElementsByTagName('Prefix')).forEach((prefixEl) => {
    const key = prefixEl.textContent;
    if (key === path) return;
    items.push({ key, name: key.slice(0, -1).split('/').pop(), isFolder: true });
  });

  Array.from(xmlDoc.getElementsByTagName('Key')).forEach((keyEl) => {
    const key = keyEl.textContent;
    if (key === path || hiddenFiles.includes(key)) return;
    const lastModifiedEl = keyEl.parentNode.querySelector('LastModified');
    const sizeEl = keyEl.parentNode.querySelector('Size');
    items.push({
      key,
      name: key.split('/').pop(),
      isFolder: false,
      lastModified: lastModifiedEl ? new Date(lastModifiedEl.textContent) : null,
      size: sizeEl ? parseInt(sizeEl.textContent, 10) : NaN,
    });
  });

  return items;
}

function listObjects(path) {
  const baseUrl = `https://${bucketName}.${s3Domain}/?list-type=2&delimiter=%2F${path ? `&prefix=${encodeURIComponent(path)}` : ''}`;

  loading.classList.remove('hidden');
  errorAlert.classList.add('hidden');
  allItems = [];

  function fetchPage(token) {
    const url = token ? `${baseUrl}&continuation-token=${encodeURIComponent(token)}` : baseUrl;
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const xmlDoc = new DOMParser().parseFromString(text, 'text/xml');
        allItems = allItems.concat(parseXML(xmlDoc, path));
        const nextToken = xmlDoc.querySelector('NextContinuationToken')?.textContent;
        return nextToken ? fetchPage(nextToken) : null;
      });
  }

  fetchPage(null)
    .then(() => {
      updateBreadcrumb(path);
      renderItems();
      loading.classList.add('hidden');
    })
    .catch((err) => {
      loading.classList.add('hidden');
      errorAlert.textContent = `Error fetching objects: ${err.message}`;
      errorAlert.classList.remove('hidden');
    });
}

// Search — filters currently rendered rows
searchInput.addEventListener('input', (e) => {
  const filter = e.target.value.toLowerCase();
  for (const row of objectList.getElementsByTagName('tr')) {
    const cell = row.getElementsByTagName('td')[0];
    if (!cell) continue;
    row.style.display = cell.textContent.toLowerCase().includes(filter) ? '' : 'none';
  }
});

// Dark mode — uses data-theme on body, defaults to system preference
const darkModeSwitch = document.getElementById('darkModeSwitch');

function applyTheme(dark) {
  document.body.dataset.theme = dark ? 'dark' : 'light';
  darkModeSwitch.checked = dark;
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

darkModeSwitch.addEventListener('change', (e) => applyTheme(e.target.checked));

const storedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(storedTheme ? storedTheme === 'dark' : prefersDark);

// Pagination — re-renders from allItems, no re-fetch needed
document.getElementById('prevPage').addEventListener('click', () => {
  currentPage = Math.max(currentPage - 1, 1);
  renderItems();
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  currentPage = Math.min(currentPage + 1, totalPages);
  renderItems();
});

function updatePaginationControls(totalPages) {
  document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById('prevPage').disabled = currentPage <= 1;
  document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Sort column headers
function updateSortIndicators() {
  for (const key of ['name', 'date', 'size']) {
    const th = document.getElementById(`sort-${key}`);
    if (!th) continue;
    th.querySelector('.sort-arrow').textContent = sortKey === key ? (sortAsc ? ' ↑' : ' ↓') : '';
  }
}

for (const { id, key } of [
  { id: 'sort-name', key: 'name' },
  { id: 'sort-date', key: 'date' },
  { id: 'sort-size', key: 'size' },
]) {
  const th = document.getElementById(id);
  if (!th) continue;
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    sortKey === key ? (sortAsc = !sortAsc) : (sortKey = key, sortAsc = true);
    currentPage = 1;
    renderItems();
  });
}

// Browser back/forward support
window.addEventListener('popstate', (e) => {
  const path = e.state?.path ?? '';
  currentPage = 1;
  currentPath = path;
  searchInput.value = '';
  listObjects(path);
});

// Initialize — read prefix from URL for deep-link support
const initialPrefix = new URLSearchParams(location.search).get('prefix') ?? '';
navigateTo(initialPrefix, true);
