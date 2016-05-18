 var ref = new Firebase('https://intense-fire-5524.firebaseio.com');
 var k;

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
					var userId = userData.uid;
					// Creating the firebase object
					var f = new Firebase(ref + "users/" + userData.uid).set({
							email: self.email
					});
					var f2 = new Firebase(ref + "follow/" + userData.uid + "/" + userData.uid).set(false);
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
			var empty = null;
			new Firebase(ref + "pola/" + self.usr).on("value", function(snapshot){
				empty = snapshot.val();
			});
			new Firebase(ref + "pola/" + self.usr).limitToLast(1).once("value", function(snapshot){
				var key = snapshot.val();
				if (!empty || key[Object.keys(key)].timestamp != t) {
					self.readImage(self,t);
				} else {
					alert("You have already uploaded a photo today! \nSee you tomorrow for new adventures!");
				}
			});
		},
		// Read the photo 
		readImage: function(context,t) {
			context.upload= "uploading";
			var file = $("#inputPhoto")[0].files[0]; // Fetching the chosen photo
			var fileType = /image.*/
			if ($('#inputPhoto').val()==''){ // If no image has been selected
				alert("Select a photo!");
			} else if (file.type.match(fileType)) { // Else we read the file and create a 64bits version
				var reader = new FileReader();
				reader.onload = function(e) {
					var img = new Image();
					img.src = reader.result;
					context.uploadToFirebase(context,t,img.src);
				}
				reader.readAsDataURL(file); 
			} else {
				alert("File not supported !");
			}
		},
		// Upload to Firebase
		uploadToFirebase : function(context,t,source) {
			var f = new Firebase(ref + "pola/" + context.usr).push({
				timestamp: t,
				filePayload: source,
				caption: $('#inputPhotoName').val()
			},function() { // Callback showing the uploaded photo and clearing the fields
				context.url = source;
				context.upload = "uploaded";
				$('#inputPhoto').val('');
				$('#inputPhotoName').val('');
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

/******* MY FRIENDS PHOTOS ********/
// /!\ TODO change user photos into friends photos
var myFriendsFeedComponent = Vue.extend({
	props: ["photos"],
	template: `
		<div class="row row-hv-centered" id="my-friends-feed-component">
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<h3>My friends feed:</h3> <br />
				<div id="container">
				<div v-for="photo in photos" class="swipingPicture" style="display:block;" @mousedown="swipe()">
					<img class="polaroid" v-bind:style="{ backgroundImage: 'url(' + photo.filePayload + ')', display:block}">
					</img>
				</div>
			</div>
			</div>
		</div>
	`,
	methods: {
		// Swipe a photo
		swipe: function(){
			console.log($(".swipingPicture"));
			// Swiper Right: save the picture into my feed
			$(".swipingPicture").on("swiperight",function(){
      			$(this).addClass('rotate-left').delay(700).fadeOut(1);
      			$('.swipingPicture').find('.status').remove();
      			$(this).append('<div class="status save">Save in my feed!</div>');      
    		});  

		    // Swiper Left: delete the picture
		    $(".swipingPicture").on("swipeleft",function(){
		    	$(this).addClass('rotate-right').delay(700).fadeOut(1);
		        $('.swipingPicture').find('.status').remove();
		        $(this).append('<div class="status delete">Delete!</div>');
		    });
		}
	}
});

/******* LOGGED COMPONENT *******/
var loggedComponent = Vue.extend({
	props: ['usr','photos'],
	template: `
		<!-- FILE UPLOAD COMPONENT -->
		<upload-component :usr="usr"></upload-component>
		<!-- LAST UPLOADS COMPONENT -->
		<last-uploads-component :photos="photos"></last-uploads-component>
		<!-- MY FRIENDS FEED COMPONENT -->
		<my-friends-feed-component :photos="photos"></my-friends-feed-component>
	`,
	components: {
		"upload-component" : uploadComponent,
		"last-uploads-component" : lastUploadsComponent,
		"my-friends-feed-component" : myFriendsFeedComponent
	}
});

/****** SEARCH-FOLLOW USER COMPONENT *******/
var searchComponent = Vue.extend({
	props: ['usr'],
	template: `<div class="row row-hv-centered" id="upload-form" style="background-color:white;">
			<h3> Follow your friends </h3>
			<div class="center-content margin-bottom">
				<input type="text" id="inputSearchUser" class="form-control" style="margin-top:2px;" placeholder="search by email">
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<button type="button" class="btn btn-default btn-info quicksand" id="upload" @click="searchUser()">
					Search
				</button>
				
				<div id="searchResults" v-if="searching==true && followDone!=true"> 
					<h3>Results</h3> 
					<p> {{inputEmail}} <button class="btn btn-default btn-info quicksand" @click="followUser()">Follow</button>
				</div>
				<div id="searchResults" v-if="searching==false"></div>
				<div id="searchResults" v-if="searching==true && followDone==true"> 
					<h3>Results</h3> 
					<p>{{inputEmail}} <button class="btn btn-primary disabled">Following</button>
				</div>
				
			</div>
		</div>`,
	data: function(){
		return {
			follower: "",
			following: "",
			inputEmail: "",
			searching: "",
			followDone: ""	
		}
	},
	methods:{
		//Search a user by email
		searchUser: function(){
			var self = this;
			var email = $('#inputSearchUser').val();
			var fb = ref;

			if( email ){ 
				loadRecord(email);  
			}
			else { 
				alert('Write an email'); 
			}

			//Search for the email in the data under users
			function loadRecord(email) {
 				fb.child('users/').once('value', function (snap) {
 					k=snap.val();
 					var foundUser;
 					//search for the user with that email, If a found him save id of follower, following
 					Object.getOwnPropertyNames(k).forEach(function(element,index,array){
 						if(k[element].email == email){
 							self.follower = self.usr;
 							self.following = element;
 							self.inputEmail = k[element].email;

 							//check if you already follow that user(look for following userId unde the follower userId )
		 					var f = new Firebase(ref + "follow/" + self.follower);
		 					var followingCheck = self.following;
		 					f.once("value", function(snapshot) {
			 					var a = snapshot.child(followingCheck).exists();
			 					//if there is a record
			 					if (a == true){
			 						f.once("value", function(snapshot){
			 							var data = snapshot.child(followingCheck).val();
			 							//if the record=true(user follows him)
			 							if(data == true){
			 								self.followDone = true;
			 								self.searching = true;
			 								foundUser = true;
			 							}
			 							//record = false (user doesnt follow him anymore)
			 							else{
			 								self.followDone = false;
			 								self.searching = true;
			 								foundUser = true;
			 							}
			 						})
			 						
			 					}
			 					else{
			 						self.followDone = false;
			 						self.searching = true;
			 						foundUser = true;
			 					}
			 				})
 						}
 						else{
 							foundUser = false;
 						}
 					})

 					//The following conditions check what will be displayed to the user
 					if (foundUser == true && self.followDone == true) {
 						$('#searchResults').text(' ');
 					}
 					if (foundUser == true && self.followDone == false) {
 						$('#searchResults').text(' ');
 					}
 					if(foundUser == false){
 						self.searching = false;
 						$('#searchResults').text('No user with that email address');
 					}
 				});
			}
		},
		//Follow a user
		followUser: function(){
			var self = this;
			var fb = ref;
			var test=false;
			self.followDone = true;
			$('#searchResults').text('');
			fb.child('/follow').once('value', function (snap) {
				var k=snap.val();
				Object.getOwnPropertyNames(k).forEach(function(element,index,array){
					
					if(element == self.follower){
					 	var f = new Firebase(ref + "follow/" + self.follower + "/" + self.following).set(true);
					 	var test = true;
					}
				})
				if(test==false){
						alert("Couldn't follow user");				 						
				}
			});
		}
	}
});

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
	},
	components: {
		"logged-component" : loggedComponent,
		"authentication-component" : authComponent,
		"search-component" : searchComponent
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
