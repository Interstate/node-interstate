var http		= require( 'http' );
var https		= require( 'https' );
var Interstate	= function( params ) {

	const INTERSTATE_HOST	= 'interstateapp.com';
	const API_HOST			= 'api.interstateapp.com';
	const API_VERSION		= 2;
	this.clientId			= null;
	this.secret				= null;
	this.redirectUri		= null;
	this.oauthToken			= null;
	this.https				= true;
	var self				= this;
	var maps				= {
		
		client_id:		'clientId',
		client_secret:	'secret',
		redirect_uri:	'redirectUri',
		oauth_token:	'oauthToken',
		https:			'https'
	
	};
	
	for( var i in params ) {
	
		if( maps[ i ] ) {
			
			this[ maps[ i ] ] = params[ i ];
		
		}
	
	}

	this.getApiUrl = function( withHost ) {
		
		return ( ( withHost !== false ) ? ( ( self.https ) ? 'https://' : 'http://' ) + API_HOST : '' ) + '/v' + API_VERSION + '/';
		
	
	}
	
	this.getRootUrl = function() {
		
		return ( ( self.https ) ? 'https://' : 'http://' ) + INTERSTATE_HOST + '/';
		
	
	}
	
	this.getAuthorizeUrl = function() {

		return self.getRootUrl() + 'oauth2/authorize?client_id=' + self.clientId + '&redirect_uri=' + self.redirectUri + '&response_type=code';

	}
	
	this.setAccessToken = function( token ) {
		
		this.oauthToken = token;
	
	}
	
	this.sign = function( uri ) {
		
		if( self.oauthToken == null ) {
			
			return uri;
		
		} else {

			if( uri.indexOf( '?' ) > -1 ) {
			
				uri += '&oauth_token=' + self.oauthToken;
			
			} else {
				
				uri += '?oauth_token=' + self.oauthToken;
			
			}
			
			return uri;
		
		}

	
	}

	this.getAccessToken = function() {
	
		var params = {
			
			code:		 null,
			type:		'authorization_code',
			setToken:	true,
			callback:	false,
		
		};
		
		var val;
	
		for( var i = 0; i < arguments.length; i++ ) {
		
			val = arguments[ i ];
			
			if( i === 0 ) {
				
				params.code = val;
			
			} else if( typeof val == 'string' ) {
				
				params.type = val;
			
			} else if( typeof val == 'boolean' ) {
			
				params.setToken = val;
			
			} else if( typeof val == 'function' ) {
				
				params.callback = val;
				
			}
		
		}
			
		var post = {
			
			'client_id':		self.clientId,
			'client_secret':	self.secret,
			'redirect_uri':		self.redirectUri
		
		};
		
		switch( params.type ) {
			
			default:
				case 'authorization_code':
				
				post.grant_type = 'authorization_code',
				post.code		= params.$code;
				
				break;
				
			case 'refresh_token':
				
				post.grant_type		= 'refresh_token';
				post.refresh_token	= params.code;
				
				break;
		
		}
		
		this.fetch( {
			
			url:	'oauth2/token',
			post:	post
		
		}, function( err, resp ) {
			
			if( !err ) {
				
				if( params.setToken ) {
					
					self.setAccessToken( resp.access_token );
				
				}
				
				if( params.callback ) {
				
					params.callback( false, resp );
				
				}
				
			} else {
				
				params.callback( err );
			
			}
		
		});
		
	}
	
	this.fetch = function() {
		
		var params = {
		
			url:		false,
			post:		{},
			callback:	false
			
		};
		var val;
		
		for( var i = 0; i < arguments.length; i++ ) {
			
			val = arguments[ i ];
			
			if( i === 0 ) {
			
				if( typeof val == 'string' ) {
					
					params.url = val;
				
				} else if( typeof val == 'object' ) {
					
					params = val;
				
				}
			
			} else if( typeof val == 'object' && typeof arguments[ 0 ] == 'string' ) {
				
				params.post = val;
			
			} else if( typeof val == 'function' ) {
				
				params.callback = val;
				
			}
		
		}
				
		if( params.url.indexOf( ' ' ) > -1 ) {
		
			var parts	= params.url.split( ' ' );
			params.verb	= parts[ 0 ];
			params.url	= parts[ 1 ];
		
		}
		
		if( params.url[ 0 ] == '/' ) {
		
			params.url = params.url.substr( 1 );
		
		}
		
		params.url = self.sign( self.getApiUrl( false ) + params.url );
		
		if( self.https ) {
		
			var req = https.request({
			
				host:		API_HOST,
				path:		params.url,
				method:		( params.verb ) ? params.verb.toUpperCase() : 'GET',
				headers:	{
					
					'Accept':		'text/json',
					'Content-type':	'text/json'
				
				},
				port:	443
			
			});
				
		} else {
		
			var req = http.request({
			
				host:		API_HOST,
				path:		params.url,
				method:		( params.verb ) ? params.verb.toUpperCase() : 'GET',
				headers:	{
					
					'Accept':		'text/json',
					'Content-type':	'text/json'
				
				},
				port:	80
			
			});
		
		}
		
		req.addListener( 'response', function( resp ) {
			
			var data = '';
			
			resp.addListener( 'data', function( dat ) {
			
				data += dat;
			
			});
			
			resp.addListener( 'end', function() {
				
				try {
				
					var json = JSON.parse( data );
					
					if( json.error ) {
					
						params.callback( json.error );
					
					} else {
						
						params.callback( false, json.response );
					
					}
					
				} catch( e ) {
					
					params.callback( { code: resp.statusCode, message: '' } );
				
				}
			
			});
		
		});
		
		if( params.post.length > 0 ) {
		
			req.write( JSON.stringify( params.post ) );
		
		}
		
		req.end();
	
	};
	
};

module.exports = Interstate;