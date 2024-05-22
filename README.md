# doorstep-navi

Repository for the development of information terminals to be installed at the doorstep, displaying the status of the neighbourhood and the near future.

<img src="output.png" width="320" alt="Sample Screen"/>

To run doorstep-navi, you must first create a `secrets.json` that will contain
your API keys.

```json
{
  "api-keys": {
    "openweather": "API_KEY",
    "newsapi": "API_KEY",
    "google-calendar": {        // service account key
      "type": "service_account",
      "project_id": "xxx",
      "private_key_id": "xxx",
      "private_key": "-----BEGIN PRIVATE KEY-----\nxxxxxx\n-----END PRIVATE KEY-----\n",
      "client_email": "xxx@xxx.iam.gserviceaccount.com",
      "client_id": "xxx",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/xxx%40xxx.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    }
  }
}
```

After preparing `secrets.json`, run doorstep-navi to create the Kiosk screen.

```shell
npm start
```
