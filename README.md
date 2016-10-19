DialerPureCloudAPIDemo
======================

A simple Website that shows how to use [Interactive Intelligence, Inc](https://www.inin.com)'s [PureCloud](https://mypurecloud.com) performance queries [API](https://developer.mypurecloud.com) 

Installation
------------

### Installation in [Docker](https://www.docker.com) :heart: :heart:

Clone this project:
```sh
$ git clone https://bitbucket.org/gildas_cherruel/purecloud_nice
```

Make sure you have [Docker](https://www.docker.com) and [Docker Compose](https://docs.docker.com/compose) installed.

Build  the containers:

```sh
docker-compose build
```

### Deployment on [Heroku](https://heroku.com) :sunglasses:

These instructions are for Mac OS/X, but I suspect Linux and Windows would be quite similar.  
Run all commands from the *root* of the project.

1. Create an [account](https://signup.heroku.com/signup/dc) with heroku or make sure you have one already.
2. Make sure you have the [Heroku toolbelt](https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up) loaded... 
   Check their [getting started](https://devcenter.heroku.com/articles/getting-started-with-nodejs) document otherwise.  
   Make sure node.js is installed as well (See the Local Installation section)
3. Login your heroku account
   ```sh
   heroku login
   ```
4. Clone the repository from github:  
   ```sh
   git clone https://github.com/gildas/DialerPureCloudAPIDemo.git
   ```
5. Create the application, from the repository folder:  
   ```sh
   heroku create
   ```
6. Configure your PureCloud OAUTH Application to accept the URL that was just created.  
   For instance: `http://sharp-rain-871.herokuapp.com/`
7. Deploy the application to your [Heroku apps](https://dashboard.heroku.com/apps).  
   ```sh
   git push heroku master
   ```
8. Configure the instance with the PureCloud organizations you want (be sure to create the config.json file [see the next section]):  
   ```sh
   heroku config:set PURECLOUD_ORGANIZATIONS="$(jq -c -M '.purecloud.organizations' config.json)"
   ```
   The best is to use the JSON file you created while testing locally (or to write one) and to process it with [jq](https://stedolan.github.io/jq) under Mac or Linux to get a compact string.  
   On Windows, using PowerShell 3.0+, one could write:  
   ```posh
   heroku config:set PURECLOUD_ORGANIZATIONS=((Get-Content config.json) -join "`n" | ConvertFrom-Json | Select purecloud | select organizations | ConvertTo-Json -Compress)
   ```
   (_To be tested!_)
9. Make sure the instance is running  
   ```sh
   heroku ps:scale web=1
   ```
   Here I give only 1 Dyno, for a quick test, that's more than enough.  
   In production, we should use more dynos.
10. Have fun a use it!  
   Either open your browser and go to the web site created in 3, or type:  
   ```sh
   heroku open
   ```

To see if it is all smooth, you can check the logs at:
```sh
heroku logs --tail
```

Checkout our own Heroku dyno: [https://young-gorge-17675.herokuapp.com/](https://young-gorge-17675.herokuapp.com/)

Running it with [Docker](https://www.docker.com)
------------------------------------------------

### While testing or developing

To start the container:
```sh
$ docker-compose up
```

If you need to rebuild the images, simply run:
```sh
$ docker-compose up --build
```

Then browse to: `http://localhost:3000/`

### In a production environment
TODO:  This section will need to be way more documented. E.g.: deployment on Hyper-V, AWS, Azure, etc.

To start the containers:
```
$ PURECLOUD_CLIENT_ID=ahbfe PURECLOUD_CLIENT_SECRET=12456 docker-compose -f docker-compose.yml -f docker-compose.production.yml up
```

Configuration
-------------

In the root folder of the project, write a config.json file, like this:

```json
{
  "port": 3000,
  "purecloud": {
    "organizations": [
      {
        "id": "ORG UUID",
        "name": "My Australian Organization",
        "region": "mypurecloud.com.au",
        "application": {
          "strategy": "implicit",
          "id":       ""APP UUID
        }
      },
      {
        "id": "ORG UUID",
        "name": "My US Organization",
        "region": "mypurecloud.com",
        "application": {
          "strategy": "implicit",
          "id":       ""APP UUID
        }
      }
    ]
  }
}
```

An example is provided in [config-sample.json](../blob/master/config-sample.json).

Notes:
- To use the default values, you can omit the value in the JSON.
- The default port is 3000
- You can have as many organizations as you want.
- Provide the actual organization ID from your PureCloud Organization Settings (under: /directory/#/admin/general-info/details)
- Provide the actual application ID from your [PureCloud OAUTH Settings](http://developer.mypurecloud.com/api/rest/authorization/).

Unit Testing
------------

(TODO: Rewrite this section!)

To run the tests once, run:
```
$ npm test
```

If you are writing code, you can run the tests continuously:
```sh
npm run test_ci
```

If you want to see some additional debug messages during the tests:
```
DEBUG=x,y,z npm run test_ci
```

Where x,y,z is a comma-separated list of these possible values:
- test  (this traces the tests themselves)

If you want to run the tests in docker, just type:
```sh
$ ./drun --test
```

TODO
====

- Tracing: [winston](https://github.com/winstonjs/winston), [Bunyan](https://github.com/trentm/node-bunyan), [tutorial](https://blog.risingstack.com/node-js-logging-tutorial/)

AUTHORS
=======
Gildas Cherruel

