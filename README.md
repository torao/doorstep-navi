# doorstep-navi

Repository for the development of information terminals to be installed at the doorstep, displaying the status of the neighbourhood and the near future.

<img src="output.png" width="320" alt="Sample Screen"/>

To run doorstep-navi, you must first create a `secrets.json` that will contain
your API keys.

```json
{
  "api-keys": {
    "openweather": "xxx",
    "newsapi": "xxx"
  }
}
```

After preparing `secrets.json`, run doorstep-navi to create the Kiosk screen.

```shell
npm start
```
