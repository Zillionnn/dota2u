const openid=require('openid');
const url=require('url');
const querystring=require('querystring');
const relyingParty=new openid.RelyingParty(
    'http://steamcommunity.com/openid/id/',
    null,
    false,
    false,
    []
);

let server=require('http').createServer(function (req, res) {
    let parsedUrl=url.parse(req.url);
    if(parsedUrl.pathname=='/authenticate'){
        let query=querystring.parse(parsedUrl.query);
        let identifier=query.openid_identifier;
        
        relyingParty.authenticate(identifier,false,function (error, authUrl) {
            if(error){
                res.writeHead(200);
                res.end('Authentication failed');

            }else if(!authUrl){
                res.writeHead(200);
                res.end('Authentication failed');
            }else{
                res.writeHead(302,{Location:authUrl});
                res.end();
            }
        });
    }else if(parsedUrl.pathname=='/verify'){
    //verify identity assertion
        //NOTE  :passing just the url is also possible
        relyingParty.verifyAssertion(req,function (error, result) {
            res.writeHead(200);
            res.end(!error&& result.authenticated ? 'Success:) '  : 'Failure:(' );
        });

    }else {
        res.writeHead(200);
        res.end('<!DOCTYPE html><html><body>'
            + '<form method="get" action="/authenticate">'
            + '<p>Login using OpenID</p>'
            + '<input name="openid_identifier" />'
            + '<input type="submit" value="Login" />'
            + '</form></body></html>');
    }
});

server.listen(80);
