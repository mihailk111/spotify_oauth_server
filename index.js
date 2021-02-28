const express = require("express");
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();

/*
      SETTINGS
*/

const USER = { //user
      "code": '',
      "userinfo": ''
};


let file          = './access.json'; // file with token
const port        = process.env.PORT;// 443 or 80
let clientid      = '7d9bde70a7784095a85e23f80a094ead';
let clientsecret  = 'df980cef263d4d23b8318df5b1b5ec3f';
let callbackurl   = 'https://request-spotify.glitch.me/callback';  // callback url
let scopes        = 'ugc-image-upload '+  //scopes
                    'user-read-recently-played '+
                    'user-read-playback-state '+
                    'user-top-read '+
                    'app-remote-control '+
                    'playlist-modify-public '+
                    'user-modify-playback-state '+
                    'playlist-modify-private '+
                    'user-follow-modify '+
                    'user-read-currently-playing '+
                    'user-follow-read '+
                    'user-library-modify '+
                    'user-read-playback-position '+
                    'playlist-read-private '+
                    'user-read-email '+
                    'user-read-private '+
                    'user-library-read '+
                    'playlist-read-collaborative '+
                    'streaming';


/* 
    GLOBALS 
*/
let interval;
let access_obj; // tokens here

/*
      STARTUP TASKS
*/
// Check if the file exists in the current directory.
fs.access(file, constants.F_OK, (err) => {
    if (!err)
    {
        let file_content=  fs.readFile(file, 'utf8', (err, data)=>{
            if (!err && data.length > 0)
            {
                let json = JSON.parse(data);
                access_obj = json;
                renew_token();

                interval = setInterval(()=>{ renew_token(); },                     
                    (access_obj.expires_in) * 1000 );
            }
        });
        
    }
  });

/*
      GET CURENT TOKEN
*/
app.get("/gettoken", (request, response) => {
   if (request.query.code === USER.code)
    {
      response.send(access_obj.access_token);
    } 
});

// юзер попадает сюда когда подтверждает access
app.get("/callback", (request, response) => {

  get_new_token(request, response);
    
});

/*
      GIVE IT TO USER
*/
app.get("/reg", (request, response) => { 
  
 response.redirect('https://accounts.spotify.com/authorize?client_id='+clientid+'&response_type=code&redirect_uri='+encodeURIComponent(callbackurl)+'&scope='+encodeURIComponent(scopes)+'&state=34fFs29kd09');
  
});

// express start
const listener = app.listen(port, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// новый токен + html 
async function get_new_token(callb_req, callb_res){ 
  
  const data = 'grant_type=authorization_code&code='+encodeURIComponent(callb_req.query.code) + '&redirect_uri='+encodeURIComponent(callbackurl)+'&client_id='+encodeURIComponent(clientid)+'&client_secret='+encodeURIComponent(clientsecret);
    
  let fResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'post',
          body:    data,
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            },
      });
    
    if (fResponse.ok)
    {
      let json = await fResponse.json();  
      console.log(json);
      
      fs.writeFile(file, JSON.stringify(json), (err)=>{console.log(err ? 'file write error!': 'data written to file')});
      access_obj = json;
      
      callb_res.send('<h3> Успех! Можете покинуть данную страницу </h3>');
      
        if (interval === undefined)
        {
          interval = setInterval(()=>{ renew_token(); },                     
          (access_obj.expires_in) * 1000 );

        }
      
    }
    else
      {
        let res = `
          <h3>Что-то пошло не так</h3>
          <a href="`+`https://request-spotify.glitch.me/reg`+`">Попробовать снова</a>
        `;
        callb_res.send(res);

      }

  }

// обновлдение токена
async function renew_token(){ 
  
  const data = 'grant_type=authorization_code&code='+encodeURIComponent(access_obj.refresh_token) + '&redirect_uri='+encodeURIComponent(callbackurl)+'&client_id='+encodeURIComponent(clientid)+'&client_secret='+encodeURIComponent(clientsecret);
    
  let fResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'post',
          body:    data,
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length,
            },
      });
    
    if (fResponse.ok)
    {
      let json = await fResponse.json();  
      fs.writeFile(file, JSON.stringify(json), (err)=>{console.log(err ? 'file write error!': 'data written to file')});
      access_obj = json;
      
    }
    else
      {
          setTimeout(renew_token, 10000);

      }

  }




