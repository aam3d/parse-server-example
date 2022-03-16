// const logger = require('parse-server').logger; '

const fs = require('fs');
const path = require('path');
const hbs = require('handlebars');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const config = {
  username: process.env['portalUser'],
  password: process.env['portalPass'],
  url: process.env['tokenUrl'],
  organisationName: process.env['organisationName'],
  organisationId: process.env['organisationId'],
  organisationDomain: process.env['organisationDomain']
};

console.log("CLOUD CODE " + config.organisationName + " Private Load...");

// Parse.Cloud.define("initSchema", async (req) => {
//   var 
// });

function parseTemplate(data, template) {
  const { user, appName } = data;
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, template),
      "utf-8",
      (error, buffer) => {
        if (error) {
          reject(error);
        } else {
          const template = hbs.compile(buffer);
          resolve(template(data));
        }
      }
    );
  });
}

function sendDownloadMail(data) {
  // Set the parameters
  const params = {
    Destination: {
      /* required */
      CcAddresses: [
        /* more items */
      ],
      ToAddresses: [
        data.to, //RECEIVER_ADDRESS
        /* more To-email addresses */
      ],
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: "UTF-8",
          Data: data.html,
        },
        Text: {
          Charset: "UTF-8",
          Data: data.text,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: data.subject,
      },
    },
    Source: data.from, // SENDER_ADDRESS
    ReplyToAddresses: [
      /* more items */
    ],
  };

  var sesClient = new SESClient({ region: "ap-southeast-2" });
  var sendCommand = new SendEmailCommand(params);
  return sesClient.send(sendCommand);
}

Parse.Cloud.define("getDownloadEmail", async (req) => {
  var fileIds = req.params.fileIds;
  var client = new S3Client({ region: 'ap-southeast-2' });

  var lasEnabled = true;
  var intensityEnabled = true;
  var dtmEnabled = true;
  // var hillshadeEnabled = false;
  var contoursEnabled = false;
  var metadataEnabled = false;

  req.params.desiredTypes.includes("las") ? lasEnabled = true : lasEnabled = false;
  req.params.desiredTypes.includes("intensity") ? intensityEnabled = true : intensityEnabled = false;
  req.params.desiredTypes.includes("dtm") ? dtmEnabled = true : dtmEnabled = false;
  // req.params.desiredTypes.includes("hillshade") ? hillshadeEnabled = true : hillshadeEnabled = false;
  req.params.desiredTypes.includes("contours") ? contoursEnabled = true : contoursEnabled = false;
  req.params.desiredTypes.includes("metadata") ? metadataEnabled = true : metadataEnabled = false;

  var downloads = [];

  var las_downloads = [];
  if (lasEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      var getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.appId + "/las/" + fileId + "_las.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      var download = {
        type: "las",
        title: fileId,
        url: url
      };
      downloads.push(download);
      las_downloads.push(download);
    }));
  }

  var intensity_downloads = [];
  if (intensityEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      var getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.appId + "/intensity_imagery/" + fileId + "_int.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });


      var download = {
        type: "intensity",
        title: fileId,
        url: url
      };
      downloads.push(download);
      intensity_downloads.push(download);
    }));
  }

  // var hillshade_downloads = [];
  // if (hillshadeEnabled) {

  //   await Promise.all(fileIds.map(async (fileId) => {
  //     var getObjectParams = {
  //       Bucket: "aam-geocirrus-transfer",
  //       Key: config.appId + "/hillshade/" + fileId + "_hls.zip"
  //     };
  //     const command = new GetObjectCommand(getObjectParams);
  //     const url = await getSignedUrl(client, command, {
  //       // expiresIn: 3600 // 1 Hour
  //       expiresIn: 43200 // 12 Hours
  //     });

      

  //     var download = {
  //       type: "hillshade",
  //       title: fileId,
  //       url: url
  //     };
  //     downloads.push(download);
  //     hillshade_downloads.push(download)
  //   }));
  // }

  var dtm_downloads = [];
  if (dtmEnabled) {

    await Promise.all(fileIds.map(async (fileId) => {
      var getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.appId + "/be_rasters/" + fileId + "_dtm.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      var download = {
        type: "dtm",
        title: fileId,
        url: url
      };
      downloads.push(download);
      dtm_downloads.push(download);
    }));
  }


  var metadata_downloads = [];
  if (metadataEnabled) {

    await Promise.all(fileIds.map(async (fileId) => {
      var getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.appId + "/metadata/" + fileId + "_meta.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      var download = {
        type: "metadata",
        title: fileId,
        url: url
      };
      downloads.push(download);
      metadata_downloads.push(download);
    }));
  }
  var contour_downloads = [];
  if (contoursEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      var getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.appId + "/contours/" + fileId + "_cnt.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      var download = {
        type: "contours",
        title: fileId,
        url: url
      };
      downloads.push(download);
      contour_downloads.push(download);
    }));
  }

  var createEmailData = {
    user: {
      username: req.user.attributes.email,
      email: req.user.attributes.username
    },
    appName: config.organisationName,
    downloads: downloads,
    las_downloads: las_downloads,
    dtm_downloads: dtm_downloads,
    // contour_downloads: contour_downloads,
    intensity_downloads: intensity_downloads,
    hillshade_downloads: hillshade_downloads,
    metadata_downloads: metadata_downloads,
  }

  var parseTxtPromise = parseTemplate(createEmailData, "text-template.txt");
  var parseHtmlPromise = parseTemplate(createEmailData, "email-template.html");

  var data = await Promise.all([parseTxtPromise, parseHtmlPromise])

  var mailData = {
    text: data[0],
    html: data[1],
    // to: user.get("email") || user.get("username"),
    to: createEmailData.user.email,
    from: "no-reply@geocirrus.com",
    subject: "Download links " + createEmailData.appName,
  };
  var sendResult = await sendDownloadMail(mailData);
  console.log(sendResult);

  return true;
},
  {
    fields: {
      fileIds: {
        type: Object,
        options: val => {
          return val.length > 0 && val.length < 12;
        },
        required: true,
        error: "Download ID is required"
      },
      desiredTypes: {
        type: Object,
        options: val => {
          return val.length > 0;
        },
        required: true,
        error: "Types list is required"
      }
    },
    requireUser: true,
    requireUserKeys: {
      emailVerified: {
        options: true,
        error: "Only verified users can download files"
      }
    }
  });

Parse.Cloud.define("getDownload", async (req) => {
  var fileId = req.params.fileId;
  var client = new S3Client({ region: 'ap-southeast-2' });
  var getObjectParams = {
    Bucket: "aam-geocirrus-transfer",
    Key: config.appId + "/" + fileId + ".las"
  };
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(client, command, {
    // expiresIn: 3600 // 1 Hour
    expiresIn: 43200 // 12 Hours
  });
  return url;
},
  {
    fields: {
      fileId: {
        type: String,
        required: true,
        error: "Download ID is required"
      }
    },
    requireUser: true,
    requireUserKeys: {
      emailVerified: {
        options: true,
        error: "Only verified users can download files"
      }
    }
  });

Parse.Cloud.define("getToken", async (req) => {
  try {
    let expiration = "600"; //10 Hours
    let response = await Parse.Cloud.httpRequest({
      method: 'POST',
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      url: config.url,
      body: {
        username: config.username,
        password: config.password,
        client: "referer",
        ip: "",
        referer: req.params.referer,
        expiration: expiration,
        f: "json"
      }
    });
    return response.text;
  }
  catch (ex) {
    console.log(ex, ex.stack);
    throw ("exception saving" + ex);
    // return false;
  }
},
  {
    fields: {
      referer: {
        type: String,
        required: true,
        error: "referer is required"
      }
    },
    requireUser: true,
    requireUserKeys: {
      emailVerified: {
        options: true,
        error: "Only verified users can get a token"
      }
    }
  });

Parse.Cloud.define("gltfUsageById", async (req) => {
  var Design = Parse.Object.extend("Design");
  const query = new Parse.Query(Design);
  const designs = await query.find({ useMasterKey: true });
  var usedInDesigns = [];
  for (var i = 0; i < designs.length; i++) {
    var design = designs[i]

    for (var j = 0; j < design.attributes.sketchItems.length; j++) {
      var item = design.attributes.sketchItems[j];
      if (item && item.attributes && item.attributes.gltfId) {
        if (item.attributes.gltfId == req.params.id) {
          var publicRead = design.attributes.ACL.getPublicReadAccess();
          var roleRead = design.attributes.ACL.getRoleReadAccess(config.organisationId);
          usedInDesigns.push({ id: design.id, title: design.attributes.name, creator: design.attributes.creator, public: publicRead, role: roleRead });
          break;
        }
      }
    }
  }
  return (usedInDesigns);
},
  {
    requireUser: true
  });

Parse.Cloud.define("designUsageById", async (req) => {
  var Project = Parse.Object.extend("Project");
  var ProjectOption = Parse.Object.extend("ProjectOption");
  var projectQuery = new Parse.Query(Project);
  var projects = await projectQuery.find({ useMasterKey: true });
  var idList = {};
  for (var j = 0; j < projects.length; j++) {
    var currentProject = projects[j];
    var optionIds = currentProject.attributes.optionIds;
    for (var k = 0; k < optionIds.length; k++) {
      var currentId = optionIds[k];
      idList[currentId] = currentId;
    }
  }

  var usedInOptions = [];

  for (const property in idList) {
    const query = new Parse.Query(ProjectOption);
    const option = await query.get(property, { useMasterKey: true });

    if (option.attributes.designId == req.params.id) {
      var publicRead = option.attributes.ACL.getPublicReadAccess();
      var roleRead = option.attributes.ACL.getRoleReadAccess(config.organisationId);
      usedInOptions.push({ id: option.id, title: option.attributes.title, creator: option.attributes.creator, public: publicRead, role: roleRead });
    }
  }

  return (usedInOptions);
},
  {
    requireUser: true
  });

Parse.Cloud.beforeSave(Parse.User, async (request) => {
  var user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("beforeSave: guest");
    throw (new Error("You'ren't authorised to sign up"));
  }
  else if (user.attributes.email && (user.attributes.email.includes(config.organisationDomain) || user.attributes.email.includes("@aamgroup.com"))) {
    console.log("beforeSave: " + user.attributes.email);
    if (user.attributes.email.includes("@aamgroup.com")) {
      console.log("beforeSave: aam approved");
    }
    else if (user.attributes.email != user.attributes.username) {
      console.log("beforeSave: user/email mismatch");
      throw (new Error("You'ren't authorised to sign up"));
    }
  }
  else {
    console.log("beforeSave: OTHER");
    throw (new Error("You are not authorised to sign up"));
  }
});

Parse.Cloud.afterSave(Parse.User, async (request) => {
  var user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("afterSave: guest");
    throw (new Error("You are not authorised guest"));
  }
  else if (user.attributes.email && (user.attributes.email.includes(config.organisationDomain) || user.attributes.email.includes("@aamgroup.com"))) {
    console.log("afterSave: " + user.attributes.email);
    //  console.log(config.organisationId + " USER");
    var addToOrgPromise = addUserToRole(user, config.organisationId);
    var addToMemberPromise = addUserToRole(user, "Member");
    return Promise.all([addToOrgPromise, addToMemberPromise]);
  }
  else {
    console.log("afterSave: OTHER");
  }
});

function addUserToRole(user, roleName) {
  // console.log("ADD USER TO ROLE");
  var query = new Parse.Query(Parse.Role);
  query.contains("name", roleName);
  return query.find({ useMasterKey: true }).then((roles) => {
    if (roles.length > 0) {
      var savePromises = [];
      // console.log("Found Roles" + roles);
      for (var i = 0; i < roles.length; i++) {
        // console.log("role[" + i + "]" + roles[i]);
        roles[i].getUsers().add(user);
        // console.log("add");
        savePromises.push(roles[i].save(null, { useMasterKey: true }));
      }
      // console.log("added");
      return Promise.all(savePromises);
    }
    else {
      // console.log("No Roles Found");
      var roleACL = new Parse.ACL();
      // console.log("1");
      roleACL.setPublicReadAccess(true);
      // console.log("2");
      roleACL.setPublicWriteAccess(false);
      // console.log("3");
      var organisationRole = new Parse.Role(roleName, roleACL);
      // console.log("4");
      organisationRole.getUsers().add(user);
      // console.log("5");
      var savePromise = organisationRole.save(null, { useMasterKey: true });
      // console.log("6");
      return savePromise;
    }
  }).catch((error) => {
    console.log(error);
    return Promise.reject();
  });
}

console.log("CLOUD CODE " + config.organisationName + " Loaded");
