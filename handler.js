'use strict';

const util = require('util');
const waterfall = require('async/waterfall');

const gm = require('gm').subClass({
  imageMagick: true
});

const REPO_BUCKET = process.env.REPO_BUCKET || 'c3s-clothes-repo';

const resize = require('./transformer').resize;

module.exports.transform = (event, context, callback) => {
  // Read options from the event.
  console.log("Reading options from event:\n", util.inspect(event, {
    depth: 5
  }));

  const srcBucket = event.Records[0].s3.bucket.name;
  // Object key may have spaces or unicode non-ASCII characters.
  const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
  console.log("srcKey: ", srcKey);

  // Sanity check: validate that source and destination are different buckets.
  if (srcBucket === REPO_BUCKET) {
    callback("Source and destination buckets are the same.");
    return;
  }

  // Infer the image type.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
    callback("Could not determine the image type.");
    return;
  }
  console.log('image type: ', typeMatch[1]);
  const imageType = typeMatch[1];
  if (imageType !== "jpg" && imageType !== "JPG") {
    callback('Unsupported image type: ${imageType}');
    return;
  }

  const params = {
    Bucket: srcBucket,
    Key: srcKey
  };

  resize(params).then(result => callback(result)).catch(err => {
    console.error('caguht err: ', JSON.stringify(err, null, 2));
  })
};
