'use static';

const _ = require('lodash/core');
const gm = require('gm').subClass({
  imageMagick: true
});

const waterfall = require('async/waterfall');

const AWS = require('aws-sdk');
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
const REPO_BUCKET = process.env.REPO_BUCKET || 'c3s-clothes-bucket';

const s3 = new AWS.S3({
  region: AWS_REGION //sydney
});

function* sizeGenerator() {
  yield {
    screen: 'xl',
    width: 380
  };
  yield {
    screen: 'lg',
    width: 320
  };
  yield {
    screen: 'md',
    width: 240
  };
  yield {
    screen: 'sm',
    width: 150
  };
  yield {
    screen: 'xs',
    width: 100
  };
}

module.exports = {
  resize: ({
    Bucket,
    Key
  }) => {
    function resizePhoto(response, next) {
      const size = SG.next().value;
      if (!size) {
        next('invalid size');
      } else {
        gm(response.Body).resize(size.width)
          .toBuffer((err, buffer) => {
            if (err) {
              console.error('buffer error: ', JSON.stringify(err, null, 2));
              next(err);
            } else {
              // Stream the transformed image to a different S3 bucket.
              const Key2 = `${baseName}-${size.screen}.${extension}`;
              s3.putObject({
                  Bucket: REPO_BUCKET,
                  Key: `${baseName}/${Key2}`,
                  Body: buffer,
                  ContentType: response.ContentType
                },
                (s3err, data) => {
                  if (s3err) {
                    console.error('err1: ', JSON.stringify(s3err, null, 2));
                    next(s3err);
                  } else {
                    next(null, {
                      ContentType: response.ContentType,
                      Body: buffer
                    });
                  }
                });
            }
          });
      }
    }

    const SG = sizeGenerator();
    const parts = Key.split('.');
    const extension = parts.splice(-1, 1);
    const baseName = parts.join('.');
    return new Promise((resolve, reject) => {
      waterfall([
          (next) => {
            // Download the image from S3 into a buffer.
            s3.getObject({
              Bucket,
              Key
            }, next);
          },
          (response, next) => {
            gm(response.Body).toBuffer((err, buffer) => {
              s3.putObject({
                Bucket: REPO_BUCKET,
                Key: `${baseName}/${Key}`,
                Body: buffer,
                ContentType: response.ContentType
              },
              (err, data) => {
                if (err) {
                  console.error(JSON.stringify(err, null, 2));
                  next(err);
                } else {
                  next(null, {
                    ContentType: response.ContentType,
                    Body: buffer
                  });
                }
              });
            });
          },
          resizePhoto, // 'xl'
          resizePhoto, // 'lg'
          resizePhoto, // 'md'
          resizePhoto, // 'sm'
          resizePhoto, // 'xs',
          (response, next) => {
            s3.deleteObject({
              Bucket,
              Key
            }, (err, data) => {
              if (err) {
                next(err);
              } else {
                console.log('delete object: ', data);
                next(null, data);
              }
            })
          }
        ],
        (err, result) => {
          if (err) {
            console.error('final err: ', JSON.stringify(err, null, 2));
            reject(err);
          } else {
            resolve(result)
          }
        }
      );
    })
  }
}