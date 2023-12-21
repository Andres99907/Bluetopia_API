'use strict';
const moment = require("moment");
module.exports = (app) => {
   let ActionLogger=  app.registry.createModel(
      "ActionLogger",
      {
        'clasification':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(20)"
          }
        },
        'action':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(200)"
          }
        },
        'ip':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(15)"
          }
        },
        'requestMethod':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(10)"
          }
        },
        'headers':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(500)"
          }
        },
        'username':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(100)"
          }
        },
        'email':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(100)"
          }
        },
        'userId':{
          "type":"number"
        },
        'body':{
          "type":"string",
          "mysql":{
            "dataType":"LONGTEXT"
          }
        },
        'result':{
          "type":"string",
          "mysql":{
            "dataType":"LONGTEXT"
          }
        },
        'query':{
          "type":"string"
        },
        'error':{
          "type":"string",
          "mysql":{
            "dataType":"MEDIUMTEXT"
          }
        },
        'timestamp':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(30)"
          }
        },
        'status':{
          "type":"number",
          "mysql":{
            "dataType":"TINYINT"
          }
        },
        'statusCode':{
          "type":"string",
          "mysql":{
            "dataType":"VARCHAR(5)"
          }
        },

      },
     {
      "options": {
        "validateUpsert": true
      }
    }
   )
    app.model(ActionLogger,
      {
        "dataSource": "mysqlDev",
        "public": false
      }
      
    )


  app.remotes().after('**', async (ctx) => {
    await saveLog(ctx, app,"after");
  });
  app.remotes().afterError('**', async (ctx) => {
    await saveLog(ctx, app,"afterError");
  });

 
  async function saveLog(ctx, app,type) {
    let user;
    if (!ctx.req.accessToken) {
      user = { name: null, email: null, id: null };
    }
    else {
      user = await ctx.req.accessToken.user.get();
    }
    let body = ctx.req.body;
    let blacklistedWords =["login", "contraseña", "password"]

    function includes(target, pattern){
      var value = false;
      pattern.forEach(function(word){
        value = value | target.includes(word);
      });
      return (value)
  }
    if(includes(ctx.req._parsedUrl.pathname.toLowerCase(),blacklistedWords)){

      if(!!body && typeof(body)=="object"){

        let keys = Object.keys(body);

        keys = keys.filter(k=>includes(k.toLowerCase(),blacklistedWords))

        keys.forEach(key => {
          body[key]="**********"
        });
      }
    }

    let userAgent = ctx.req.headers['user-agent']
    let { accept, origin, referer } = ctx.req.headers;
    let newLog = {
      ip: ctx.req.connection.remoteAddress,
      clasification: type,
      timestamp: moment().toISOString(),
      userId: user.id,
      username: user.username,
      email: user.email,
      result: JSON.stringify(ctx.result),
      requestMethod: ctx.req.method,
      status: ctx.req.status,
      statusCode: ctx.req.res.statusCode,
      headers: JSON.stringify({ accept, origin, referer,userAgent}),
      action: ctx.req.baseUrl + ctx.req._parsedUrl.pathname,
      body: JSON.stringify(body),
      error: JSON.stringify(ctx.error),
      query: JSON.stringify(ctx.req.query),
    };
    app.models.ActionLogger.create(newLog);
  }
};

