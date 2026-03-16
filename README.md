# S3 Directory Listing

A lightweight, zero-dependency client-side UI that turns any AWS S3 bucket into a clean, navigable file browser. Drop four files into your bucket and you're done.

**[Live Demo](https://s3-directory-listing.s3.amazonaws.com/index.html) · [Releases](https://github.com/flightlesstux/S3-Directory-Listing/releases) · [Landing Page](https://flightlesstux.github.io/S3-Directory-Listing/)**

---

## Features

- **Folder navigation** with breadcrumb trail and browser back/forward support
- **Deep linking** — share or bookmark any subfolder via `?prefix=` URL
- **Search** to filter files and folders on the current page
- **Sortable columns** — click Name, Last Modified, or Size headers to sort; folders always stay on top
- **Pagination** — configurable items per page
- **File type icons** — 40+ extensions mapped to specific icons (image, PDF, archive, code, audio, video, etc.)
- **Dark mode** — toggle with persistence via `localStorage`
- **Empty folder state** — friendly message instead of a blank table
- **S3 continuation token** support — correctly handles folders with more than 1000 objects

---

## Quick Start

### 1. Upload the four files to your S3 bucket

```
index.html
s3.js
config.js
dark-mode.css
```

### 2. Edit `config.js`

```js
export const bucketName = 'your-bucket-name';
export const s3Domain   = 's3.amazonaws.com';   // or a region endpoint, e.g. s3.eu-west-1.amazonaws.com
export const itemsPerPage = 10;                  // items shown per page
export const hiddenFiles  = ['index.html', 's3.js', 'dark-mode.css', 'config.js'];
```

`hiddenFiles` is the list of filenames the UI will hide from the listing. Add your own app files here if needed.

### 3. Configure your S3 bucket

See the [AWS Setup](#aws-setup) section below.

### 4. Open the bucket's static website URL

```
https://<your-bucket-name>.s3-website-<region>.amazonaws.com
```

---

## AWS Setup

### Bucket Policy

Allow public read access. Replace `<your-bucket-name>`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3DirectoryListing",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject", "s3:ListBucket"],
            "Resource": [
                "arn:aws:s3:::<your-bucket-name>/*",
                "arn:aws:s3:::<your-bucket-name>"
            ]
        }
    ]
}
```

To restrict access to specific IP addresses, add a condition:

```json
"Condition": {
    "IpAddress": {
        "aws:SourceIp": "<your-ip-or-cidr>"
    }
}
```

### Static Website Hosting

1. Open your bucket in the AWS Console → **Properties** tab
2. Scroll to **Static website hosting** → **Edit**
3. Set **Enable**, and set both **Index document** and **Error document** to `index.html`
4. Save

### CORS Configuration

Required for the browser to call the S3 listing API:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

---

## Configuration Reference

All options live in `config.js`:

| Key | Type | Description |
|---|---|---|
| `bucketName` | string | Your S3 bucket name |
| `s3Domain` | string | S3 endpoint domain (default: `s3.amazonaws.com`) |
| `itemsPerPage` | number | How many items to show per page (default: `10`) |
| `hiddenFiles` | string[] | Root-level filenames to hide from the listing |

---

## CloudFront

CloudFront **cannot** be used as a drop-in replacement for `s3Domain`. The app fetches the S3 XML listing API (`list-type=2`) directly — CloudFront proxies object downloads but does not expose that endpoint.

**Options for keeping the bucket private:**

- **ALB + VPC Interface Endpoint for S3** — exposes the bucket only via an Application Load Balancer inside your VPC. The listing API remains accessible without making the bucket public. ([AWS guide](https://aws.amazon.com/blogs/networking-and-content-delivery/hosting-internal-https-static-websites-with-alb-s3-and-privatelink/))
- **Pre-generated manifest** — run `aws s3api list-objects-v2` at deploy time, save the output as `contents.json`, and modify `s3.js` to read from that file instead. Bucket can be fully private; listing data is just a static JSON file.

CloudFront can still sit in front of the HTML/JS files themselves — just keep `s3Domain` pointing at the raw S3 endpoint.

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/). A GitHub Release is created automatically when a `v*` tag is pushed. Each release includes `index.html`, `s3.js`, `config.js`, and `dark-mode.css` as downloadable assets.

| Version | Notes |
|---|---|
| v2.0.0 | Fixed pagination, continuation token, URL encoding, URL history, sort, file icons, empty state, removed jQuery |
| v1.0.0 | Initial versioned release |

---

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss what you'd like to change.

---

## License

MIT
