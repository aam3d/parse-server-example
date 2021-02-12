// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var app = express();

var config = {};

config.sesAPIKey = process.env['sesAPIKey'];
config.sesAPISecret = process.env['sesAPISecret'];
var mongoURL = process.env['mongoDatabaseURL'];
var mongoPass = process.env['mongoDatabasePort'];
var mongoUser = process.env['mongoDatabaseUser'];
var mongoPass = process.env['mongoDatabasePassword'];
var mongoDatabase = process.env['mongoDatabaseName'];
var mongoDatabaseURI = 'mongodb://' + mongoUser + ":" + mongoPass + '@' + mongoURL + ":" + mongoPort + '/' + mongoDatabase;
config.mongoDatabaseURI = mongoDatabaseURI
config.appId = process.env['appId'];
config.masterKey = process.env['masterKey'];
config.jsKey = process.env['jsKey'];
config.bucketName = process.env['bucketName'];
config.bucketRegion = process.env['bucketRegion'];
config.port = 1343;
config.organisationId = process.env['organisationId'];
config.organisationName = process.env['organisationName'];
config.organisationDomain = process.env['organisationDomain'];
config.domainName = process.env['domainName'];

var baseServerUrl = 'http://localhost:' + config.port + '/' + config.organisationId;
var publicBaseServerUrl = 'https://' + config.domainName + '/' + config.organisationId;

var privateServer = new ParseServer({
    databaseURI: config.mongoDatabaseURI,
    cloud: 'cloud/main.js',
    appId: config.appId,
    masterKey: config.masterKey,
    jsKey: config.jsKey,
    serverURL: baseServerUrl + '/parse',
    appName: config.organisationName,
    publicServerURL: publicBaseServerUrl + '/parse',
    verifyUserEmails: true,
    preventLoginWithUnverifiedEmail: true,
    // caseInsensitive: false,
    emailAdapter: {
        module: 'parse-server-simple-ses-adapter-with-template',
        options: {
            fromAddress: 'no-reply@geocirrus.com',
            apiKey: config.sesAPIKey,
            apiSecret: config.sesAPISecret,
            domain: 'geocirrus.com',
            amazon: 'https://email.ap-southeast-2.amazonaws.com'
        }
    },
    filesAdapter: {
        "module": "parse-server-s3-adapter",
        "options": {
            "bucket": config.bucketName,
            // optional:
            "region": config.bucketRegion, // default value
            "bucketPrefix": config.organisationId + '/', // default value
            "directAccess": false, // default value
            "fileAcl": null, // default value
            "baseUrl": null, // default value
            "baseUrlDirect": false, // default value
            "signatureVersion": 'v4', // default value
            "globalCacheControl": null, // default value. Or 'public, max-age=86400' for 24 hrs Cache-Control
            "ServerSideEncryption": 'AES256|aws:kms', //AES256 or aws:kms, or if you do not pass this, encryption won't be done
            "validateFilename": null, // Default to parse-server FilesAdapter::validateFilename.
            "generateKey": null // Will default to Parse.FilesController.preserveFileName
        }
    },
    customPages: {
        passwordResetSuccess: publicBaseServerUrl + "/templates/password_reset_success.html",
        verifyEmailSuccess: publicBaseServerUrl + "/templates/verify_email_success.html",
        linkSendSuccess: publicBaseServerUrl + "/templates/link_send_success.html",
        linkSendFail: publicBaseServerUrl + "/templates/link_send_fail.html",
        invalidLink: publicBaseServerUrl + "/templates/invalid_link.html",
        invalidVerificationLink: publicBaseServerUrl + "/templates/invalid_verification_link",
        choosePassword: publicBaseServerUrl + "/templates/choose_password.html"
        // parseFrameURL: "./templates/parseFrameURL",
    }
});
app.use('/' + config.organisationId + '/parse', privateServer);

app.get('/' + config.organisationId + '/hello', function (req, res)
{
    res.status(200).send("TEST (" + config.organisationId + '):' + Date.now());
});

app.get('/health', function (req, res)
{
    res.status(200).send("HEALTHY");
});

app.use('/' + config.organisationId + '/templates', express.static(path.join(__dirname, '/templates')));

app.listen(config.port, function ()
{
    console.log('parse-server (' + config.organisationId + ') running on port ' + config.port);
});
