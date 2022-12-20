// const logger = require('parse-server').logger;

const config = {
  username: process.env['portalUser'],
  password: process.env['portalPass'],
  url: process.env['tokenUrl'],
  organisationName: process.env['organisationName'],
  organisationId: process.env['organisationId'],
  organisationDomain: process.env['organisationDomain'],
  additionalDomains: process.env['additionalDomains']
};

console.log("CLOUD CODE " + config.organisationName + " Public Load...");

// Parse.Cloud.define("initSchema", async (req) => {
//   var
// });

Parse.Cloud.define("getToken", async (req) => {
  try {
    const expiration = "180"; // 3 Hours
    const response = await Parse.Cloud.httpRequest({
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
});

function validateEmail(email) {
  let isValidEmail = (email.includes(config.organisationDomain) || email.includes("@aamgroup.com") || email.includes("@woolpert.com"));
  if (!isValidEmail) {
    isValidEmail = email.includes(config.additionalDomains)
  }
}

Parse.Cloud.beforeSave(Parse.User, async (request) => {
  const user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("beforeSave: guest");
  }
  else if (user.attributes.email && validateEmail(user.attributes.email)) {
    console.log("beforeSave: " + user.attributes.email);
    throw (new Error("You are not authorised to sign up"));
  }
  else {
    console.log("beforeSave: OTHER");
  }
});

Parse.Cloud.afterSave(Parse.User, async (request) => {
  const user = request.object;

  // console.log("afterSave", JSON.stringify(user.attributes, null, 2));
  if (user.attributes.authData && user.attributes.authData.anonymous) {
    console.log("afterSave: guest");
    return addUserToRole(user, "Guest");
  }
  else if (user.attributes.email && validateEmail(user.attributes.email)) {
    console.log("afterSave: " + user.attributes.email);
    throw (new Error("You are not authorised"));

    //  var addToOrgPromise = addUserToRole(user, config.organisationId);
    //  var addToMemberPromise = addUserToRole(user, "Member");
    //  return Promise.all([addToOrgPromise,addToMemberPromise]);
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

console.log("CLOUD CODE " + config.organisationName + " Public Loaded");
