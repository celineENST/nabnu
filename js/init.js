 var ref = new Firebase('https://intense-fire-5524.firebaseio.com');

// Hide the loading message
$.mobile.loading().hide();

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
			console.log(self);
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
					var f2 = new Firebase(ref + "follow/" + userData.uid + "/" + userData.uid + "/following").set(false);
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
	props: ["usr","currentView","url"],
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
	`,
	data: function() {
		return {
			upload: "please upload a file"
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
				context.currentView = 'current-upload'
			});
		}
	}
});

/******* LAST UPLOADS COMPONENT *******/
var lastUploadsComponent = Vue.extend({
	props: ["photos"],
	template: `
		<div class="row row-hv-centered" id="last-uploads">
			<div class="col-md-12 col-xs-12 col-lg-12 center-content no-margin-no-padding">
				<h3>Your last uploads:</h3> <br />
				<ul class="no-margin-no-padding">
					<li v-for="photo in photos" style="display: inline;">
						<img v-bind:src="photo.filePayload" width="140" height="140" class="img-rounded">
					</li>
				</ul>
			</div>
		</div>
	`
});

/******* MY FRIENDS PHOTOS ********/
var myFriendsFeedComponent = Vue.extend({
	props: ["friendsphotos"],
	template: `		
		<div class="row row-hv-centered" id="my-friends-feed">
			<div class="col-md-12 col-xs-12 col-lg-12 center-flex-column">
				<h3>Friends Feed</h3> <br />
				<div id="container">
					<div v-for="photo in friendsphotos" class="swipingPicture" style="display:block;" @mousedown="swipe()">
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
			fbi = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/images');

			// Swiper Right: save the picture into my feed
			$(".swipingPicture").on("swiperight",function(){
				$(this).addClass('rotate-left').delay(700).fadeOut(1);
  				$('.swipingPicture').find('.status').remove();
  				$(this).append('<div class="status save">Save in my feed!</div>'); 

				if($(this).find("div").attr("class") == "status save"){
					var url_image = ($(this).find("img").attr("style").split("url(")[1]).split(");")[0];

					fbi.once('value', function(snap){
						var k = snap.val();
						Object.keys(k).forEach(function(element, index, array){
							if(k[element].filePayload == url_image){ 
								// Add the photo to the folder /likes
								fbil = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/likes/' + element);
								fbil.update(k[element]);
								console.log("Photo added");
								// Remove the photo from the folder /images
								fbii = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/images/' + element);
								fbii.remove();
							}
						});
						
					});   
				}
      			  
    		});  

		    // Swiper Left: delete the picture
		    $(".swipingPicture").on("swipeleft",function(){
		    	$(this).addClass('rotate-right').delay(700).fadeOut(1);
		        $('.swipingPicture').find('.status').remove();
		        $(this).append('<div class="status delete">Delete!</div>');

		        if($(this).find("div").attr("class") == "status delete"){
					var url_image = ($(this).find("img").attr("style").split("url(")[1]).split(");")[0];

					fbi.once('value', function(snap){
						var k = snap.val();
						Object.keys(k).forEach(function(element, index, array){
							if(k[element].filePayload == url_image){ 
								// Add the photo to the folder /dislikes
								fbil = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/dislikes/' + element);
								fbil.update(k[element]);
								console.log("Photo removed");
								// Remove the photo from the folder /images
								fbii = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/images/' + element);
								fbii.remove();
							}
						});
						
					});   
				}
		    });
		}
	}
});

/******* LIKES SAVED PHOTOS COMPONENT *******/
var savedPhotosComponent = Vue.extend({
	props: ["savedfriendsphotos"],
	template: `
		<div class="row row-hv-centered" id="saved-photos-component">
			<div class="col-md-12 col-xs-12 col-lg-12 center-content no-margin-no-padding">
				<h3>Saved Photos:</h3> <br />
				<ul class="no-margin-no-padding">
					<li v-for="photo in savedfriendsphotos" style="display: inline;">
						<img v-bind:src="photo.filePayload" width="140" height="140" class="img-rounded">
					</li>
				</ul>
			</div>
		</div>
	`
});

/****** SEARCH-FOLLOW USER COMPONENT *******/
var searchComponent = Vue.extend({
	props: ['usr'],
	template: `
		<div class="row row-hv-centered" id="search" style="background-color:white;">
			<h3> Follow your friends </h3>
			<div class="center-content margin-bottom">
				<input type="text" id="inputSearchUser" class="form-control" placeholder="search by email">
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<button type="button" class="btn btn-default btn-info quicksand" id="upload" @click="searchUser()">
					Search
				</button>
				<div id="searchResults" v-if="(searching==true && followDone!=true) || unfollowDone == true"> 
					<h3>Results</h3> 
					<p> {{inputEmail}} <button class="btn btn-default btn-info quicksand" @click="followUser()">Follow</button>
				</div>
				<div id="searchResults1" v-if="searching==true && followDone==true && unfollowDone!=true"> 
					<h3>Results</h3> 
					<p>{{inputEmail}} <button class="btn btn-primary" @click="unfollowUser()">Unfollow</button>
				</div>
				<div id="searchResults2" v-if="foundUser == false">
					<h3>Results</h3>
					<p>{{searchErrorMsg}}
				</div>
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<div id="followResults"> 
					<div>People you follow </div>
					<button class="btn btn-primary" @click="peopleYouFollow()">Following</button>
				</div>
				<ul>
					<li v-for="item in followings" align="left">
						{{item}}
					</li>
				</ul>
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<div id="followResults"> 
					<button class="btn btn-primary" @click="peopleFollowYou()">Followers</button>
				</div>
				<ul>
					<li v-for="item in followers" align="left">
						{{item}}
					</li>
				</ul>
			</div>
			<div v-if="noFollowers==true">{{noFollowersMsg}}</div>
		</div>
	`,
	data: function(){
		return {
			follower: "",
			following: "",
			inputEmail: "",
			searching: null,
			followDone: "",
			unfollowDone: "",
			searchError:false,
			searchErrorMsg:" ",
			foundUser: null,
			followingEmail: "",
			followerEmail: "",
			followers:[],
			followings:[],
			noFollowers:"",
			noFollowersMsg:""
		}
	},
	methods:{
		//Search a user by email
		searchUser: function(){
			var self = this;
			self.searchError = false;
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
 					var k=snap.val();
 					self.searching = null;
 					self.searchErrorMsg = " ";
 					self.searchError = false;
 					self.foundUser = false;
 					
 					
 					//search for the user with that email, If I found him I save id of follower, following
 					//Check that the user doesnt enter his email
 					Object.getOwnPropertyNames(k).forEach(function(element,index,array){
	 						if(k[element].email == email && element != self.usr ) {
	 							self.follower = self.usr;
	 							self.following = element;
	 							self.inputEmail = k[element].email;
	 							//check if you already follow that user(look for following userId unde the follower userId )
			 					var f = new Firebase(ref + "follow/" + self.follower);
			 					var followingCheck = self.following;
			 					f.once("value", function(snapshot) {
				 					var a = snapshot.child(followingCheck).exists();
				 					//if there is a record
				 					if (a == true) {
				 						f.once("value", function(snapshot){
				 							var data = snapshot.child(followingCheck + "/following").val();
				 							//if the record=true(user follows him)
				 							if(data == true){
				 								self.followDone = true;
				 								self.searching = true;
				 								self.foundUser= true;
				 								self.searchErrorMsg = " ";
				 							} else{ //record = false (user doesnt follow him anymore)
				 								self.followDone = false;
				 								self.searching = true;
				 								self.foundUser= true;
				 								self.searchErrorMsg = " ";
				 							}
				 						});
				 					} else {
				 						self.followDone = false;
				 						self.searching = true;
				 						self.foundUser= true;
				 						self.searchErrorMsg = " ";
				 					}
				 				});
	 						}

 					});
 					if(self.foundUser == false ){
 						self.searchErrorMsg = "Check the email address. User not found or you enter your email.";
 					}
 					
 				});
			};
		},
		// Follow a user
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
					 	var f = new Firebase(ref + "follow/" + self.follower + "/" + self.following + "/following").set(true);
					 	var test = true;
					 	self.unfollowDone = false;
					}
				})
			},function() {
				if(test==false){
					alert("Couldn't follow user");				 						
				}
			});
		},
		// Unfollow a user
		unfollowUser: function(){
			var self = this;
			var fb = ref;
			fb.child('/follow/' + self.follower + '/').once('value', function (snap) {
				var k=snap.val();
				Object.getOwnPropertyNames(k).forEach(function(element,index,array){
					
					if(element == self.following){
					 	var f = new Firebase(ref + "follow/" + self.follower + "/" + self.following + "/following").set(false);
					 	self.unfollowDone = true;
					}
				})
				
			});
		},
		peopleYouFollow: function(){
			self = this;
			var followings = [];
			followings.length = 0;
			var fb = ref;
			fb.child('/follow/' + app.usr + '/').once('value', function (snap) {
				var k=snap.val();
				Object.getOwnPropertyNames(k).forEach(function(element,index,array){
					if(k[element].following == true){
						var tempId = element;
						fb2 = ref;
						fb2.child('/users').once('value',function(snap){
							var j=snap.val();
							Object.getOwnPropertyNames(j).forEach(function(element,index,array){
								if(element == tempId ){
									self.followings.push(j[element].email);
								};
							})
						});
					}
				})
				
			});
		},
		peopleFollowYou: function(){
			var followers = [ ];
			self = this;
			var fb = ref;
			self.noFollowers = true;
			//console.log(noFollowers);
			fb.child('/follow/').once('value', function (snap) {
				var k=snap.val();
				Object.getOwnPropertyNames(k).forEach(function(element,index,array){
					var temp = element;
					var fb2 = ref;
					fb2.child('/follow/' + element).once('value', function (snapshot){
						var j = snapshot.val();
						Object.getOwnPropertyNames(j).forEach(function(element,index,array){
							if (element == app.usr && j[element].following == true) {
								var tempId = temp;
								fb3 = ref;
								fb3.child('/users').once('value',function(snap){
									var g=snap.val();
									Object.getOwnPropertyNames(g).forEach(function(element,index,array){
										if(element == tempId ){
											var data = g[element].email;
											self.followers.push(data);
											self.noFollowers = false;
										};
									})
								});
							}
						})

					});
				})
			})
			if (self.noFollowers == true) {
				self.noFollowersMsg = "no one follows you";
			}
		}
	}
});


/******* LOGGED COMPONENT *******/
var loggedComponent = Vue.extend({
	props: ['usr','photos','friendsphotos','savedfriendsphotos'],
	data: function() {
		return {
			currentView: 'upload-component',
			url: ""
		}
	},
	template: `
		<div id="head" class="row">
			<div class="col-md-4 col-md-offset-4 col-xs-6 col-xs-offset-3 col-lg-4 col-lg-offset-4" style="display: flex; align-items: center; justify-content: center; height: 100%;">
				<h4>{{(currentView == 'my-friends-feed-component') ? "My Feed" : (currentView == 'search-component') ? "Follow" : (currentView == 'upload-component') ? "Upload a new Photo" : (currentView == 'saved-photos-component') ? "Likes" : "Last Uploads" }}</h4>
			</div>
		</div>
		<component  :is="currentView" keep-alive :usr="usr" :url.sync="url" :photos="photos" :current-view.sync="currentView" :friendsphotos="friendsphotos" :savedfriendsphotos="savedfriendsphotos">
		</component>
		<div id="nav" class="row">
			<div class="link col-md-2 col-xs-2 col-lg-2" v-bind:class="{'active' : currentView == 'my-friends-feed-component'}" @click="go('my-friends-feed-component')"><span class="fa fa-home fa-fw"></span></div>
			<div class="link col-md-2 col-xs-2 col-lg-2" v-bind:class="{'active' : currentView == 'search-component'}" @click="go('search-component')"><span class="fa fa-users fa-fw"></span></div>
			<div class="link col-md-2 col-xs-2 col-lg-2" v-bind:class="{'active' : currentView == 'upload-component'}" @click="go('upload-component')"><span class="fa fa-camera-retro fa-fw"></span></div>
			<div class="link col-md-2 col-xs-2 col-lg-2" v-bind:class="{'active' : currentView == 'saved-photos-component'}" @click="go('saved-photos-component')"><span class="fa fa-heart fa-fw"></span></div>
			<div class="link col-md-2 col-xs-2 col-lg-2" v-bind:class="{'active' : currentView == 'last-uploads-component'}" @click="go('last-uploads-component')"><span class="fa fa-paw fa-fw"></span></div>
			<div class="link col-md-2 col-xs-2 col-lg-2" @click="logOut()"><span class="fa fa-sign-out fa-fw"></span></div>
		</div>
	`,
	methods: {
		go: function(comp) {
			this.currentView = comp;
		},
		logOut: function() {
			app.logOut();
		}
	},
	components: {
		"upload-component" : uploadComponent,
		"last-uploads-component" : lastUploadsComponent,
		"my-friends-feed-component" : myFriendsFeedComponent,
		"search-component" : searchComponent,
		"current-upload" : currentUploadComponent,
		"saved-photos-component" : savedPhotosComponent
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
		},
		disappear: function() {
			$("#header").remove();
			$("#content").attr("style","display: visible;");
		}
	},
	components: {
		"logged-component" : loggedComponent,
		"authentication-component" : authComponent,
	}
});

/******* GLOBAL FUNCTIONS *******/

// Fetching the user's feed. In the following steps, we'll be fetching the user's friends' feeds
function fetchUserFeed() {
	app.$bindAsArray("photos",new Firebase( 'https://intense-fire-5524.firebaseio.com/pola/' + app.usr).limitToLast(5));
}

// Fetching the user's friends' feeds
function fetchFriendFeed() {
	app.$bindAsArray("friendsphotos",new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + "/images").limitToLast(5));
}

// Fetching the user's likes
function fetchSavedFriendFeed(){
	// Fetching friends photos
		fb = new Firebase( 'https://intense-fire-5524.firebaseio.com/follow/');
		fbf = new Firebase('https://intense-fire-5524.firebaseio.com/pola/');
		nf = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/images');
		likes = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/likes');
		dislikes = new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/dislikes');

		// Look for who follows the app.usr
		fb.child(app.usr).once('value', function (snap) {
	 		var k=snap.val();
	 		Object.getOwnPropertyNames(k).forEach(function(element,index,array){
	 			// 'element' is every id-user that app.usr may follow
	 			if(k[element].following == true){ // check if the following is effective
	 				// Fetch the photos from the followed user
	 				fbf.child(element).once('value', function (snapf) {
	 					var kf = snapf.val();
	 					var already = false;

	 					// Check if photos are not already in the likes or dislikes folder of this user
	 					Object.getOwnPropertyNames(kf).forEach(function(elementf) {
	 						// 'elementf' is the id of each photo
	 						// LIKES folder
	 						likes.once('value', function (snapl){
	 							var kl = snapl.val();
	 							if(kl){
	 								Object.keys(kl).forEach(function(elementl) {
		 								if(elementl == elementf){
		 									already = true; 	
		 								}
		 							});
	 							}
	 							
	 						});
	 						// DISLIKES folder
	 						dislikes.once('value', function(snapd) {
	 							var kd = snapd.val();
	 							if(kd){
	 								Object.keys(kd).forEach(function(elementd) {
		 								if(elementd == elementf){
		 									already = true;
		 								}
		 							});
	 							}
	 						});	 							
	 					});
	 					if(!already){
							nf.update(kf);
							console.log("Image added");
						}
	 				});
	 			}
	 		});
		});
	app.$bindAsArray("savedfriendsphotos",new Firebase('https://intense-fire-5524.firebaseio.com/follow/' + app.usr + '/likes'));
}

// Callback checking if we have authentified. Authentication persists 24H by default
function authDataCallback(authData) {
	if (authData) {
		app.usr = authData.uid;
		fetchUserFeed();
		fetchFriendFeed();
		fetchSavedFriendFeed();
		app.logged = true;
	} else {
		app.usr = "";
		app.logged = false;
	}
}

ref.onAuth(authDataCallback);