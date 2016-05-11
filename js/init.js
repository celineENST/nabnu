var ref = new Firebase('https://intense-fire-5524.firebaseio.com');

// We use a partial for a html template with data binding inside
Vue.partial('current-upload',`
	<div class="row row-hv-centered" id="current-upload">
		<div class="col-md-12 col-xs-12 col-lg-12 center-content">
			<h3>{{ upload }} </h3><br />
			<img width="20%" v-bind:src="url"/>
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
	methods: {
		// Authentication Methods
		loginSignup: function() {
			var self = this;
			// We check if we need to create a new account first
			if (self.authentication == "Sign Up") {
				// Create the user
				ref.createUser({
					email    : self.email,
					password : self.pwd
				}, function(error, userData) {
					if (error) {
						console.log("Error creating user:", error);
						alert("Couldn't create user!");
						return;
					} else {
						console.log("Successfully created user account with uid:", userData.uid);
					}
				});
			} 
			// If not, we just log them in
			ref.authWithPassword({
				email    : self.email,
				password : self.pwd
			}, function(error, authData) {
				if (error) {
					console.log("Login Failed!", error);
				} else {
					// Keeping the usr uid in memory
					self.usr = authData.uid;
					// Resetting the fields
					self.email ="";
					self.pwd ="";
					// Fetching the user's feed. In the following steps, we'll be fetching the user's friends' feeds
					self.$bindAsArray("photos",new Firebase( 'https://intense-fire-5524.firebaseio.com/pola/' + authData.uid).limitToLast(5));
					// We are logged in, so display all the app for logged in user
					self.logged=true;
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
		// Upload Methods
		uploadPhoto: function() {
			var self = this;
			self.upload= "uploading";
			// Fetching the chosen photo
			var file = $("#inputPhoto")[0].files[0];
			var fileType = /image.*/;
			// If it is an image, then we read the file and create a 64bits version that we can read
			if (file.type.match(fileType)) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var img = new Image();
					img.src = reader.result;
					// Security wise hashing - it's not that useful for now but who knows if we're going to need it after when we want to share a single image (by the URL)
					var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(img.src));
					// Creating the firebase object
					var f = new Firebase(ref + "pola/" + self.usr + "/" + hash + '/filePayload');
					// Display the image we've just uploaded
					f.set(img.src,function() {
						self.url = img.src;
						self.upload="uploaded";
					});
				}
				reader.readAsDataURL(file); 
			} else {
					alert("File not supported !");
			}
		}
	}
});