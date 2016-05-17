 var ref = new Firebase('https://intense-fire-5524.firebaseio.com');

// We use a partial for a html template with data binding inside
Vue.partial('current-upload',`
	<div class="row row-hv-centered" id="current-upload">
		<div class="col-md-12 col-xs-12 col-lg-12 center-content">
			<h3>{{ upload }} </h3><br />
			<div class="frame_polaroid">
			<figure>
				<img width="100%" v-bind:src="url"/>
				<figcaption>{{ text }}</figcaption>
			</figure>
			</div>
		</div>
	</div>
`);

// This is our principal vue. We are going to break it down in different vues in the next steps.
var app = new Vue({
	el: '#app',
	data: {
		// Authentication data
		logged: false,
		authentication: "Sign Up",
		userPrompt: "Already a User?",
		email: "",
		pwd: "",
		usr: "",
		// Upload data
		upload: "please upload a file",
		url: ""
	},
	ready: function() {
		var authData = ref.getAuth();
		if (authData) {
			app.logged = true;
			app.usr = authData.uid;
			console.log("User " + authData.uid + " is logged in with " + authData.provider);
		}
	}, 
	methods: {
		// Create User
		createUser: function() {
			var self = this;
			ref.createUser({
				email    : self.email,
				password : self.pwd
			}, function(error, userData) {
				if (error) {
					console.log("Error creating user:", error);
					alert("Couldn't create user!  \n" + error);
					return;
				} else {
					console.log("Successfully created user account with uid:", userData.uid);
				}
			});
		},
		// Sign user if needed and then log user in 
		loginSignup: function() {
			var self = this;
			// We check if we need to create a new account first
			if (self.authentication == "Sign Up") {
				self.createUser();
			}; 
			// If not, we just log them in
			ref.authWithPassword({
				email    : self.email,
				password : self.pwd
			}, function(error, authData) {
				if (error) {
					console.log("Login Failed!", error);
					alert("Login Failed! \n" + error);
				} else {
					// Resetting the fields
					self.email ="";
					self.pwd ="";
					fetchUserFeed(self.usr);
				}
			});
		},
		// Authentication Method - updating the messages
		toggleUser : function() {
			var self = this;
			switch (self.authentication) {
				case "Sign Up":
					self.authentication = "Log In";
					self.userPrompt = "No Account?";
					break;
				case "Log In":
					self.authentication = "Sign Up";
					self.userPrompt = "Already a user?";
					break;
			}
		},
		// Upload Photo
		uploadPhoto: function() {
			var self = this;
			var now = new Date();
			var t = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate();
			var c = $('#inputPhotoName').val();
			self.upload= "uploading";
			// Fetching the chosen photo
			var file = $("#inputPhoto")[0].files[0];
			var fileType = /image.*/
			// If no image has been selected
			if($('#inputPhoto').val()==''){
				alert("Select a photo!");
			}else{
				// If it is an image, then we read the file and create a 64bits version that we can read
				if (file.type.match(fileType)) {
					var reader = new FileReader();
					reader.onload = function(e) {
						var img = new Image();
						img.src = reader.result;
						// Creating the firebase object
						var f = new Firebase(ref + "pola/" + self.usr).push({
							timestamp: t,
							filePayload: img.src,
							caption: c
						},function() {
							self.url = img.src;
							self.upload = "uploaded";
						});
					}
					reader.readAsDataURL(file); 
					$('#inputPhoto').val('');
				} else {
						alert("File not supported !");
				}
			}
		}
	}
});

// Fetching the user's feed. In the following steps, we'll be fetching the user's friends' feeds
function fetchUserFeed(usrUid) {
	app.$bindAsArray("photos",new Firebase( 'https://intense-fire-5524.firebaseio.com/pola/' + usrUid).limitToLast(5));
}

// Callback checking if we have authentified. Authentication persists 24H by default
function authDataCallback(authData) {
	if (authData) {
		fetchUserFeed(authData.uid);
		app.logged = true;
		app.usr = authData.uid;
		console.log("User " + authData.uid + " is logged in with " + authData.provider);
	} else {
		app.logged = false;
		console.log("User is logged out");
	}
}
ref.onAuth(authDataCallback);