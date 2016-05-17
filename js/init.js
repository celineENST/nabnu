 var ref = new Firebase('https://intense-fire-5524.firebaseio.com');

/******* AUTHENTICATION COMPONENT *******/
var authComponent = Vue.extend({
	template: `
		<div class="row row-hv-centered" id="sign-up" v-if="this.$parent.logged!=true">
			<div class="col-md-4 col-xs-12 col-lg-4 center-content">
				<h3>{{ authentication }}</h3>
				<div class="input-group margin-bottom">
						<span class="input-group-addon" id="basic-addon1">@</span>
						<input type="text" class="form-control" placeholder="Email" v-model="email">
				</div>
				<div class="margin-bottom">
					<input type="password" class="form-control" placeholder="Password" v-model="pwd" @keyup.enter="loginSignup">
				</div>
				<button type="button" class="btn btn-default quicksand" @click="loginSignup()">
					{{ authentication }}
				</button>
				<button type="button" class="btn btn-warning quicksand" @click="toggleUser()">
					{{ userPrompt }}
				</button>
			</div>
		</div>
	`,
	data: function() {
		return {
			authentication: "Log In",
			userPrompt: "No Account?",
			email: "",
			pwd: ""
		}
	},
	methods: {
		// Login User
		login: function() {
			var self = this;
			ref.authWithPassword({
				email    : self.email,
				password : self.pwd
			}, function(error, authData) {
				if (error) {
					alert("Login Failed! \n" + error);
				} else {
					// Resetting the fields
					self.email ="";
					self.pwd ="";
					fetchUserFeed();
				}
			});
		},
		// Create User
		createUser: function() {
			var self = this;
			ref.createUser({
				email    : self.email,
				password : self.pwd
			}, function(error, userData) {
				if (error) {
					alert("Couldn't create user!  \n" + error);
					return;
				} else {
					self.login();
				}
			});
		},
		// Sign user if needed and then log user in 
		loginSignup: function() {
			var self = this;
			// We check if we need to create a new account first
			if (self.authentication == "Sign Up") {
				self.createUser();
			} else { // If not, we just log them in
				self.login();
			}			
		},
		// Authentication Method - updating the messages
		toggleUser : function() {
			switch (this.authentication) {
				case "Sign Up":
					this.authentication = "Log In";
					this.userPrompt = "No Account?";
					break;
				case "Log In":
					this.authentication = "Sign Up";
					this.userPrompt = "Already a user?";
					break;
			}
		}
	}
});
Vue.component("authentication-component",authComponent);

/******* CURRENTUPLOAD COMPONENT *******/
var currentUploadComponent = Vue.extend({
	props: ["url"],
	template: `
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
	`
})

/******* UPLOAD COMPONENT *******/
var uploadComponent = Vue.extend({
	props: ["usr"],
	template: `
		<div class="row row-hv-centered" id="upload-form">
			<div class="center-content margin-bottom">
				<input type="file" accept="image/*" capture="camera" id="inputPhoto" class="form-control">
				<input type="text" id="inputPhotoName" class="form-control" style="margin-top:2px;" placeholder="Name my photo">
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<button type="button" class="btn btn-default btn-info quicksand" id="upload" @click="uploadPhoto()">
					Upload my photo
				</button>
			</div>
		</div>
		<!-- UPLOADED FILE COMPONENT -->
		<current-upload v-if="upload == 'uploaded'" :url="url"></current-upload>
	`,
	data: function() {
		return {
			upload: "please upload a file",
			url: ""
		}
	},
	methods: {
		// Upload Photo
		uploadPhoto: function() {
			var self = this;
			var now = new Date();
			var t = now.getFullYear() + "" + (now.getMonth()+1) + "" + now.getDate(); // YYYYMMDD
			// Prevent user from uploading more than one photo per day
			var vide;
			var ref1 = new Firebase(ref + "pola/" + self.usr).on("value", function(snapshot){
				vide = snapshot.val();
			});
			var ref2 = new Firebase(ref + "pola/" + self.usr).limitToLast(1).once("value", function(snapshot){
				var key = snapshot.val();
				if (!vide || key[Object.keys(key)].timestamp != t){
					var c = $('#inputPhotoName').val();
					this.upload= "uploading";
					// Fetching the chosen photo
					var file = $("#inputPhoto")[0].files[0];
					var fileType = /image.*/
					// If no image has been selected
					if ($('#inputPhoto').val()==''){
						alert("Select a photo!");
					} else {
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
								},function() { // Callback
									self.url = img.src;
									self.upload = "uploaded";
								});
							}
							reader.readAsDataURL(file); 
							$('#inputPhoto').val('');
							$('#inputPhotoName').val('');
						} else {
							alert("File not supported !");
						}
					}
				} else {
					alert("You have already uploaded a photo today! \nSee you tomorrow for new adventures!");
				}
			});
		}
	},
	components: {
		"current-upload" : currentUploadComponent
	}
});

/******* LAST UPLOADS COMPONENT *******/
var lastUploadsComponent = Vue.extend({
	props: ["photos"],
	template: `
		<div class="row row-hv-centered" id="last-uploads">
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<h3>Your last uploads:</h3> <br />
				<ul>
					<li v-for="photo in photos" style="display: inline;">
						<img v-bind:src="photo.filePayload" width="140" height="140" class="img-rounded">
					</li>
				</ul>
			</div>
		</div>
	`
});

/******* LOGGED COMPONENT *******/
var loggedComponent = Vue.extend({
	props: ['usr','photos'],
	template: `
		<!-- FILE UPLOAD COMPONENT -->
		<upload-component :usr="usr"></upload-component>
		<!-- LAST UPLOADS COMPONENT -->
		<last-uploads-component :photos="photos"></last-uploads-component>
	`,
	components: {
		"upload-component" : uploadComponent,
		"last-uploads-component" : lastUploadsComponent
	}
});
Vue.component("logged-component",loggedComponent);

// This is our principal vue.
var app = new Vue({
	el: '#app',
	data: {
		// Authentication data
		logged: false,
		usr: ""
	}, 
	firebase : {
	},
	methods: {
		// Logging out
		logOut: function (){
			ref.unauth();
			this.logged = false;
			uploadComponent.upload = "please upload a file"
			alert("Logging out");
			location.reload();
		}
	}
});

/******* GLOBAL FUNCTIONS *******/

// Fetching the user's feed. In the following steps, we'll be fetching the user's friends' feeds
function fetchUserFeed() {
	app.$bindAsArray("photos",new Firebase( 'https://intense-fire-5524.firebaseio.com/pola/' + app.usr).limitToLast(5));
}

// Callback checking if we have authentified. Authentication persists 24H by default
function authDataCallback(authData) {
	if (authData) {
		app.usr = authData.uid;
		fetchUserFeed();
		app.logged = true;
	} else {
		app.usr = "";
		app.logged = false;
	}
}
ref.onAuth(authDataCallback);