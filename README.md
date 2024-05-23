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


## Linux

```shell
sudo apt-get install chromium-browser libx11-xcb1 libxcomposite1 libasound2t64 libatk1.0-0 libatk-bridge2.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 -y
```

Install Japanese fonts and refresh cache for Chrome headless browser.

```shell
sudo apt install language-pack-ja fonts-ipafont fonts-ipaexfont -y
fc-cache -fv
```

```shell
sudo apt install imagemagick -y
```
