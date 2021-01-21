// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var app = express();

var secrets = {};

secrets.sesAPIKey = process.env['sesAPIKey'];
secrets.sesAPISecret = process.env['sesAPISecret'];
secrets.mongoDatabaseURI = process.env['mongoDatabaseURI'];
secrets.appId = process.env['appId'];
secrets.masterKey = process.env['masterKey'];
secrets.bucketName = process.env['bucketName'];
secrets.bucketRegion = process.env['bucketRegion'];

var config = {
    port: 1343,
    client: process.env['clientId'],
    domain: process.env['domainName'],
    appName: process.env['appName']
};

var baseServerUrl = 'http://localhost:' + config.port + '/' + config.client;
var publicBaseServerUrl = 'https://' + config.domain + '/' + config.client;

var privateServer = new ParseServer({
    databaseURI: secrets.mongoDatabaseURI,
    cloud: 'cloud/main.js',
    appId: secrets.appId,
    masterKey: secrets.masterKey,
    serverURL: baseServerUrl + '/parse',
    appName: config.appName,
    publicServerURL: publicBaseServerUrl + '/parse',
    verifyUserEmails: true,
    preventLoginWithUnverifiedEmail: true,
    // caseInsensitive: false,
    emailAdapter: {
        module: 'parse-server-simple-ses-adapter-with-template',
        options: {
            fromAddress: 'no-reply@geocirrus.com',
            apiKey: secrets.sesAPIKey,
            apiSecret: secrets.sesAPISecret,
            domain: 'geocirrus.com',
            amazon: 'https://email.ap-southeast-2.amazonaws.com'
        }
    },
    // filesAdapter: {
    //     "module": "parse-server-s3-adapter",
    //     "options": {
    //         "bucket": secrets.bucketName,
    //         // optional:
    //         "region": secrets.bucketRegion, // default value
    //         "bucketPrefix": config.client + '/', // default value
    //         "directAccess": false, // default value
    //         "fileAcl": null, // default value
    //         "baseUrl": null, // default value
    //         "baseUrlDirect": false, // default value
    //         "signatureVersion": 'v4', // default value
    //         "globalCacheControl": null, // default value. Or 'public, max-age=86400' for 24 hrs Cache-Control
    //         "ServerSideEncryption": 'AES256|aws:kms', //AES256 or aws:kms, or if you do not pass this, encryption won't be done
    //         "validateFilename": null, // Default to parse-server FilesAdapter::validateFilename.
    //         "generateKey": null // Will default to Parse.FilesController.preserveFileName
    //     }
    // },
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
app.use('/' + config.client + '/parse', privateServer);

app.get('/' + config.client + '/hello', function (req, res)
{
    res.status(200).send("TEST (" + config.client + '):' + Date.now());
});

app.get('/env', function (req, res)
{
    res.status(200).send(JSON.stringify(process.env));
});

app.use('/' + config.client + '/templates', express.static(path.join(__dirname, '/templates')));

app.listen(config.port, function ()
{
    console.log('parse-server (' + config.client + ') running on port ' + config.port);
});
