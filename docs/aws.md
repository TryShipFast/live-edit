# Running on S3 and CloudFront

Two things go in a bucket: published snapshots and uploaded images. Both are
read far more often than written, and neither needs this application to be up
once written — which is the point.

## What the host needs

```bash
composer require league/flysystem-aws-s3-v3    # required for an S3 disk at all
composer require aws/aws-sdk-php               # only to sign private CloudFront URLs
```

A Laravel app without the first will fail on the first read from an S3 disk.
Worth checking before switching the disk over rather than after.

## Configuration

```
LIVE_EDIT_SNAPSHOT_DISK=s3
LIVE_EDIT_SNAPSHOT_URL=https://cdn.example.com/live-edit/content
LIVE_EDIT_MEDIA_URL=https://cdn.example.com
LIVE_EDIT_DISK=s3
```

`LIVE_EDIT_SNAPSHOT_URL` addresses the content directory itself, not the bucket
root. Passing a full disk key to something already addressing that directory
produces the directory twice, which is the first thing to check if a consumer
starts getting 404s.

## Cache behaviour, which is the reason to do this at all

| Object | Lives | Why |
|---|---|---|
| `current.json` | seconds | the only thing that changes in place |
| `v{n}/{locale}.json` | forever | a version never changes once written |
| images | forever, immutable | names are random, so a URL is that picture permanently |

Set the distribution's default TTL low and let the long-lived objects say so
for themselves through their own headers. Images are written with
`CacheControl: public, max-age=31536000, immutable` at upload time; a CDN serves
them without ever asking this application again, so nothing said later can
reach them.

Replacing an image writes a new object rather than overwriting one, which is
what makes an immutable cache safe rather than reckless.

## Access

Prefer CloudFront with Origin Access Control and a private bucket over making
the bucket public. Signing is supported for a private distribution
(`LIVE_EDIT_CLOUDFRONT_KEY_PAIR_ID` and a private key, inline or by path) but is
not needed for a distribution serving a public website — and without the keys
or the SDK it returns the plain URL rather than failing a page render.

## The IAM policy the test run needs

Scoped to one bucket, and to object actions plus creating that bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:CreateBucket", "s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::kastsbuild-content-test-*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:GetObjectAttributes"],
      "Resource": "arn:aws:s3:::kastsbuild-content-test-*/*"
    }
  ]
}
```

## Verifying against a real bucket

Ordinary runs skip this. Name a bucket and it runs:

```bash
KB_S3_BUCKET=kastsbuild-content-test-1234 \
KB_S3_REGION=eu-west-1 \
vendor/bin/phpunit --group aws
```

Credentials come from the standard AWS chain — environment, shared credentials
file, or instance role — so nothing secret is written into the repository or
passed on a command line where it would land in shell history.

Everything it writes goes under one prefix and is deleted afterwards.

It answers the questions a faked disk cannot: whether object metadata survives
a PUT, whether a prefixed key round-trips, whether the URL a page is handed
actually resolves, and whether an image is fitted before it arrives rather than
after — on a remote disk a stored path is a key, not a file, and fitting
afterwards silently did nothing.
