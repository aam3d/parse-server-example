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
  organisationDomain: process.env['organisationDomain'],
  additionalDomains: process.env['additionalDomains']
};

console.log("CLOUD CODE " + config.organisationName + " Private Load...");

// Parse.Cloud.define("initSchema", async (req) => {
//   var
// });

function parseTemplate(data, template) {
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

  const sesClient = new SESClient({ region: "ap-southeast-2" });
  const sendCommand = new SendEmailCommand(params);
  return sesClient.send(sendCommand);
}

Parse.Cloud.define("getDownloadEmail", async (req) => {
  const fileIds = req.params.fileIds;
  const client = new S3Client({ region: 'ap-southeast-2' });

  let lasEnabled = true;
  let intensityEnabled = true;
  let dtmEnabled = true;
  // var hillshadeEnabled = false;
  let contoursEnabled = false;
  let metadataEnabled = false;

  req.params.desiredTypes.includes("las") ? lasEnabled = true : lasEnabled = false;
  req.params.desiredTypes.includes("intensity") ? intensityEnabled = true : intensityEnabled = false;
  req.params.desiredTypes.includes("dtm") ? dtmEnabled = true : dtmEnabled = false;
  // req.params.desiredTypes.includes("hillshade") ? hillshadeEnabled = true : hillshadeEnabled = false;
  req.params.desiredTypes.includes("contours") ? contoursEnabled = true : contoursEnabled = false;
  req.params.desiredTypes.includes("metadata") ? metadataEnabled = true : metadataEnabled = false;

  const downloads = [];

  const las_downloads = [];
  if (lasEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      const getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.organisationId + "/las/" + fileId + "_las.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      const download = {
        type: "las",
        title: fileId,
        url: url
      };
      downloads.push(download);
      las_downloads.push(download);
    }));
  }

  const intensity_downloads = [];
  if (intensityEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      const getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.organisationId + "/intensity_imagery/" + fileId + "_int.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });


      const download = {
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
  //       Key: config.organisationId + "/hillshade/" + fileId + "_hls.zip"
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

  const dtm_downloads = [];
  if (dtmEnabled) {

    await Promise.all(fileIds.map(async (fileId) => {
      const getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.organisationId + "/be_rasters/" + fileId + "_dtm.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      const download = {
        type: "dtm",
        title: fileId,
        url: url
      };
      downloads.push(download);
      dtm_downloads.push(download);
    }));
  }


  const metadata_downloads = [];
  if (metadataEnabled) {

    await Promise.all(fileIds.map(async (fileId) => {
      const getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.organisationId + "/metadata/" + fileId + "_meta.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      const download = {
        type: "metadata",
        title: fileId,
        url: url
      };
      downloads.push(download);
      metadata_downloads.push(download);
    }));
  }
  const contour_downloads = [];
  if (contoursEnabled) {
    await Promise.all(fileIds.map(async (fileId) => {
      const getObjectParams = {
        Bucket: "aam-geocirrus-transfer",
        Key: config.organisationId + "/contours/" + fileId + "_cnt.zip"
      };
      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(client, command, {
        // expiresIn: 3600 // 1 Hour
        expiresIn: 43200 // 12 Hours
      });

      const download = {
        type: "contours",
        title: fileId,
        url: url
      };
      downloads.push(download);
      contour_downloads.push(download);
    }));
  }

  const createEmailData = {
    user: {
      username: req.user.attributes.email,
      email: req.user.attributes.username
    },
    appName: config.organisationName,
    downloads: downloads,
    las_downloads: las_downloads,
    dtm_downloads: dtm_downloads,
    contour_downloads: contour_downloads,
    intensity_downloads: intensity_downloads,
    // hillshade_downloads: hillshade_downloads,
    metadata_downloads: metadata_downloads,
  }

  const parseTxtPromise = parseTemplate(createEmailData, "text-template.txt");
  const parseHtmlPromise = parseTemplate(createEmailData, "email-template.html");

  const data = await Promise.all([parseTxtPromise, parseHtmlPromise])

  const mailData = {
    text: data[0],
    html: data[1],
    // to: user.get("email") || user.get("username"),
    to: createEmailData.user.email,
    from: "no-reply@geocirrus.com",
    subject: "Download links " + createEmailData.appName,
  };
  const sendResult = await sendDownloadMail(mailData);
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
  const fileId = req.params.fileId;
  const client = new S3Client({ region: 'ap-southeast-2' });
  const getObjectParams = {
    Bucket: "aam-geocirrus-transfer",
    Key: config.organisationId + "/" + fileId + ".las"
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
  // try {
  //   const expiration = "180"; // 3 Hours
  //   const response = await Parse.Cloud.httpRequest({
  //     method: 'POST',
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded"
  //     },
  //     url: config.url,
  //     body: {
  //       username: config.username,
  //       password: config.password,
  //       client: "referer",
  //       ip: "",
  //       referer: req.params.referer,
  //       expiration: expiration,
  //       f: "json"
  //     }
  //   });
  //   return response.text;
  // }
  try {
    const expiration = "180"; // 3 Hours
    const response = await Parse.Cloud.httpRequest({
      method: 'GET',
      // headers: {
      //   "Content-Type": "application/x-www-form-urlencoded"
      // },
      // url: config.url,
      url: "https://www.arcgis.com/sharing/rest/oauth2/token",
      params: {
        client_id: config.username,
        client_secret: config.password,
        grant_type: "client_credentials",
        expiration: expiration,
      }
    });
    return response.text;
  }
  catch (ex) {
    console.log(ex, ex.stack);
    throw ("exception saving" + ex);
    // return false;
  }
});

Parse.Cloud.define("gltfUsageById", async (req) => {
  const Design = Parse.Object.extend("Design");
  const query = new Parse.Query(Design);
  const designs = await query.find({ useMasterKey: true });
  const usedInDesigns = [];
  for (let i = 0; i < designs.length; i++) {
    const design = designs[i]

    for (let j = 0; j < design.attributes.sketchItems.length; j++) {
      const item = design.attributes.sketchItems[j];
      if (item && item.attributes && item.attributes.gltfId) {
        if (item.attributes.gltfId == req.params.id) {
          const publicRead = design.attributes.ACL.getPublicReadAccess();
          const roleRead = design.attributes.ACL.getRoleReadAccess(config.organisationId);
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
  const Project = Parse.Object.extend("Project");
  const ProjectOption = Parse.Object.extend("ProjectOption");
  const projectQuery = new Parse.Query(Project);
  const projects = await projectQuery.find({ useMasterKey: true });
  const idList = {};
  for (let j = 0; j < projects.length; j++) {
    const currentProject = projects[j];
    const optionIds = currentProject.attributes.optionIds;
    for (let k = 0; k < optionIds.length; k++) {
      const currentId = optionIds[k];
      idList[currentId] = currentId;
    }
  }

  const usedInOptions = [];

  for (const property in idList) {
    const query = new Parse.Query(ProjectOption);
    const option = await query.get(property, { useMasterKey: true });

    if (option.attributes.designId == req.params.id) {
      const publicRead = option.attributes.ACL.getPublicReadAccess();
      const roleRead = option.attributes.ACL.getRoleReadAccess(config.organisationId);
      usedInOptions.push({ id: option.id, title: option.attributes.title, creator: option.attributes.creator, public: publicRead, role: roleRead });
    }
  }

  return (usedInOptions);
},
  {
    requireUser: true
  });

function validateEmail(email) {
  let isValidEmail = (email.includes(config.organisationDomain) || email.includes("@aamgroup.com") || email.includes("@woolpert.com"))
  if (!isValidEmail) {
    console.log("Additional domains: " + config.additionalDomains);
    if (config.additionalDomains && config.additionalDomains.length > 0) {
      const domainList = config.additionalDomains.split(";");
      for (let i = 0; i < domainList.length; i++) {
        const checkDomain = domainList[i];
        console.log("Checking domain: " + checkDomain);
        if (email.includes(checkDomain)) {
          isValidEmail = true;
          break;
        }
      }
    }
  }
  return isValidEmail;
}
function validateInternalEmail(email) {
  return (email.includes("@aamgroup.com") || email.includes("@woolpert.com"))
}

Parse.Cloud.beforeSave(Parse.User, async (request) => {
  const user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("beforeSave: guest");
    throw (new Error("You'ren't authorised to sign up"));
  }
  else if (user.attributes.email && validateEmail(user.attributes.email)) {
    console.log("beforeSave: " + user.attributes.email);
    if (validateInternalEmail(user.attributes.email)) {
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
  const user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("afterSave: guest");
    throw (new Error("You are not authorised guest"));
  }
  else if (user.attributes.email && validateEmail(user.attributes.email)) {
    console.log("afterSave: " + user.attributes.email);
    //  console.log(config.organisationId + " USER");
    const addToOrgPromise = addUserToRole(user, config.organisationId);
    const addToMemberPromise = addUserToRole(user, "Member");
    return Promise.all([addToOrgPromise, addToMemberPromise]);
  }
  else {
    console.log("afterSave: OTHER");
  }
});

function addUserToRole(user, roleName) {
  // console.log("ADD USER TO ROLE");
  const query = new Parse.Query(Parse.Role);
  query.contains("name", roleName);
  return query.find({ useMasterKey: true }).then((roles) => {
    if (roles.length > 0) {
      const savePromises = [];
      // console.log("Found Roles" + roles);
      for (let i = 0; i < roles.length; i++) {
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
      const roleACL = new Parse.ACL();
      // console.log("1");
      roleACL.setPublicReadAccess(true);
      // console.log("2");
      roleACL.setPublicWriteAccess(false);
      // console.log("3");
      const organisationRole = new Parse.Role(roleName, roleACL);
      // console.log("4");
      organisationRole.getUsers().add(user);
      // console.log("5");
      const savePromise = organisationRole.save(null, { useMasterKey: true });
      // console.log("6");
      return savePromise;
    }
  }).catch((error) => {
    console.log(error);
    return Promise.reject();
  });
}

console.log("CLOUD CODE " + config.organisationName + " Private Loaded");
