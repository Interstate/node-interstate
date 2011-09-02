var Interstate = require( '../lib/interstate.js' );

var instance = new Interstate({

	client_id:		'CLIENT_ID',
	client_secret:	'CLIENT_SECRET',
	redirectUri:	'REDIRECT_URI',
	oauth_token:	'OAUTH_TOKEN'
	
});

instance.fetch( 'get /account', function( err, resp ) {

	if( !err ) {
		
		console.log( 'You are authenticated as:', resp.user.fullName );
	
	}

});