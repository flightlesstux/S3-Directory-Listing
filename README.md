
# S3-Directory-Listing 📂🎉

Welcome to the **S3-Directory-Listing** project! Are you tired of the boring, generic S3 bucket listings? 🥱 Well, look no further! 😎 This snazzy little JS script and HTML combo will turn your S3 bucket into a fancy file and folder listing with a nice UI and search functionality. Oh, and did I mention it also has a dark mode? 🌙

## Usage 🚀

To use S3-Directory-Listing, just follow these easy-peasy steps:

1. Clone this repo or copy the contents of ,`dark-mode.css`, `s3.js` and `index.html` to your S3 bucket.
2. Update the `bucketName` and `s3Domain` variables in `s3.js` with your bucket's name your S3 provider's domain name.
3. Configure your S3 bucket settings (see section below).
4. Access the `index.html` file in your browser, and voilà! 🎩✨ You now have a fancy S3 directory listing.

## S3 Bucket Settings (AWS) 🔧

To make this magic work, you need to configure your S3 bucket settings properly.
The following steps apply to AWS S3 buckets, they might differ depending on your S3 provider:

1. Make sure your S3 bucket is publicly accessible (or at least accessible to the users you want to share the directory listing with).
2. Set the bucket policy to allow public read access to your objects. Use the following policy, replacing `<your-bucket-name>` with your actual bucket name:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3DirectoryListing",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::<your-bucket-name>/*",
                "arn:aws:s3:::<your-bucket-name>"
            ]
        }
    ]
}
``` 
Or you can use an IP Policy for your bucket if you need.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3DirectoryListing",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::<your-bucket-name>/*",
                "arn:aws:s3:::<your-bucket-name>"
            ],
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "<your-ip-address>"
                }
            }
        }
    ]
}
```

Replace `<your-ip-address>` with your desired IP address or a CIDR block to restrict access to specific IP addresses.

3.  Enable static website hosting for your bucket:
    -   Go to your S3 bucket settings on the AWS Management Console.
    -   Select the "Properties" tab.
    -   Scroll down to "Static website hosting" and click "Edit".
    -   Choose "Enable" and set the "Index document" and "Error document" to `index.html`.
    -   Save your changes.

4. Update your Cross-origin resource sharing (CORS) settings like below.
```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```

5.  Note down the bucket's static website endpoint (e.g., `http://<your-bucket-name>.s3-website-<your-region>.amazonaws.com/index.html` or `https://<your-bucket-name>.s3.amazonaws.com/index.html` for secure connection). This is where you can access your fancy directory listing.

That's it! Now you can enjoy your brand new, fancy-pants S3 directory listing! 🕺💃

## A Little Extra ✨

You can customize the number of items shown per page by modifying the `itemsPerPage` variable in `s3.js`.

`
const itemsPerPage = 10; // Change this number to your desired items per page
`

## Demo

[https://s3-directory-listing.s3.amazonaws.com/index.html](https://s3-directory-listing.s3.amazonaws.com/index.html)

## Final Words 📝

Feel free to share this project with your friends, colleagues, or even your grandma! 🧓 After all, who doesn't like a fancy directory listing? 😏

If you have any questions, comments, or jokes to share, head over to the [GitHub repo](https://github.com/flightlesstux/S3-Directory-Listing) and let me know. I'd love to hear from you! 🤗

Happy listing! 📚
