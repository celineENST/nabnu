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
	props: ["url","caption"],
	methods: {
		cap: function() {
			$('#inputPhotoName').val("");
			return this.caption;
		}
	},
	template: `
		<div class="row row-hv-centered" id="current-upload">
			<div class="col-md-12 col-xs-12 col-lg-12 center-flex-column">
				<h3>You just uploaded a picture !</h3>
				<div id="container">
					<div class="photoFrame" style="display:block; margin: 0 !important;">
						<img class="polaroid" v-bind:style="{ backgroundImage: 'url(' + url + ')', display:block}">
							{{ cap() }}
						</img>
					</div>
				</div>

			</div>
		</div>
	`
})

/******* UPLOAD COMPONENT *******/
var uploadComponent = Vue.extend({
	props: ["usr","currentView","url","spinner","caption"],
	template: `
		<div class="row row-hv-centered" id="upload-form">
			<h2><i class="fa fa-cloud-upload"></i></h2>
			<div class="center-content margin-bottom">
				<input type="file" accept="image/*" capture="camera" id="inputPhoto" class="form-control">
				<input type="text" id="inputPhotoName" class="form-control" style="margin-top:2px;" placeholder="Name my photo">
			</div>
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<button type="button" class="btn btn-default btn-info quicksand" id="upload" @click="uploadPhoto()">
					Upload my photo
				</button>
			</div>
			<div id="loadSpin"></spin>
		</div>
	`,
	data: function() {
		return {
			upload: "please upload a file",
		}
	},
	methods: {
		// Upload Photo
		uploadPhoto: function() {
			//spinner
			var opts = {
			  lines: 13 // The number of lines to draw
			, length: 10 // The length of each line
			, width: 6 // The line thickness
			, radius: 30 // The radius of the inner circle
			, scale: 1 // Scales overall size of the spinner
			, corners: 1 // Corner roundness (0..1)
			, color: '#000' // #rgb or #rrggbb or array of colors
			, opacity: 0.25 // Opacity of the lines
			, rotate: 0 // The rotation offset
			, direction: 1 // 1: clockwise, -1: counterclockwise
			, speed: 1 // Rounds per second
			, trail: 60 // Afterglow percentage
			, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
			, zIndex: 2e9 // The z-index (defaults to 2000000000)
			, className: 'spinner' // The CSS class to assign to the spinner
			, top: '70%' // Top position relative to parent
			, left: '50%' // Left position relative to parent
			, shadow: false // Whether to render a shadow
			, hwaccel: false // Whether to use hardware acceleration
			, position: 'absolute' // Element positioning
			}
			var target = document.getElementById('loadSpin')
			spinner = new Spinner(opts).spin(target);

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
					spinner.stop();
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
				spinner.stop();
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
				spinner.stop();
				alert("File not supported !");
			}
		},
		// Upload to Firebase
		uploadToFirebase : function(context,t,source) {
			context.caption = $('#inputPhotoName').val();
			var f = new Firebase(ref + "pola/" + context.usr).push({
				timestamp: t,
				filePayload: source,
				caption: context.caption
			},function() { // Callback showing the uploaded photo and clearing the fields
				spinner.stop();
				context.url = source;
				context.upload = "uploaded";
				context.currentView = 'current-upload';
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
				<ul id="savedList">
					<li v-for="photo in photos" class="photoFrame" style="display:inline-block;">
						<img class="polaroid" v-bind:style="{ backgroundImage: 'url(' + photo.filePayload + ')', display:block}">
						{{photo.caption}}
						</img>
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
				<ul id="container" v-if="friendsphotos.length > 0">
					<li v-for="photo in friendsphotos" class="swipingPicture" style="display:block;" @mousedown="swipe()">
						<img class="polaroid" id ="{{photo.img_id}}" v-bind:style="{ backgroundImage: 'url(' + parse(photo.user_id,photo.img_id)  + ')', display:block}">
						{{photo.caption}}
						</img>
					</li>
				</ul>
				<div v-else>
					<h2>No new photo in feed!</h2>
				</div>
			</div>
		</div>
	`,
	methods: {
		parse : function(uid,imgid) {
			var link = 'https://intense-fire-5524.firebaseio.com/pola/' + uid + '/'  + imgid + '/filePayload.json';
			// Parsing JSON form URL
			$.ajax({
	            type: 'GET',
	            url: link,
	            async: true,
	            contentType: "application/json",
	            dataType: 'json',
	            success: function (json) {
	            	// Print to image after we've parsed
	            	$("#" + imgid).attr("style","background-image: url(" + json + "); display: block;");
	            }, error: function (e) {
	                console.log("error loading saved picture" + imgid);
	           	}
        	});
        	// While we wait for the parsing, display a loading icon
        	return "resources/wait.png";
    	},
		// Swipe a photo
		swipe: function(){
			fbi = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images');
			// Swiper Right: save the picture into my feed
			$(".swipingPicture").on("swiperight",function(){
				$(this).addClass('rotate-left').delay(700).fadeOut(1);
  				$('.swipingPicture').find('.status').remove();
  				$(this).append('<div class="status save">Save in my feed!</div>'); 

				if($(this).find("div").attr("class") == "status save"){
					var id_image_saved = $(this).find("img").attr("id");

					fbi.once('value', function(snap){
						var k = snap.val();
						Object.keys(k).forEach(function(element, index, array){
							//k[element].img_id is the photo id

							if(k[element].img_id == id_image_saved){
								// Add the photo to the folder /likes
								fbil = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/likes');
								fbil.once('value', function (snapl){
									var kl = snapl.val();
									console.log(kl);
									if(kl){
										var already = false;
										Object.keys(kl).forEach(function (elementl){
											if (kl[elementl].img_id == k[element].img_id){
												already = true;
											 }
										});
										if (!already){
											fbil.push({'user_id':k[element].user_id, 'img_id':k[element].img_id, 'caption': k[element].caption });
											console.log("Photo added");
											// Remove the photo from the folder /images
											fbii = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images/' + element);
									 		fbii.remove();
										}
									} else {
										fbil.push({'user_id':k[element].user_id, 'img_id':k[element].img_id, 'caption': k[element].caption});
										console.log("Photo added");
										// Remove the photo from the folder /images
										fbii = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images/' + element);
									 	fbii.remove();
									}	
								})	
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
		        	var id_image_deleted = $(this).find("img").attr("id");

					fbi.once('value', function(snap){
						var k = snap.val();
						Object.keys(k).forEach(function(element, index, array){
							if(k[element].img_id == id_image_deleted){ 
								// Add the photo to the folder /dislikes
								fbil = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/dislikes');
								fbil.once('value', function (snapl){
									var kl = snapl.val();
									console.log(kl);
									if(kl){
										var already = false;
										Object.keys(kl).forEach(function (elementl){
											console.log(elementl);
											console.log(kl[elementl]);
											console.log(k[element].img_id);
											if (kl[elementl].img_id == k[element].img_id){
												already = true;
											 }
										});
										if(!already){
											fb = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/dislikes/' + element);
											fb.update({'user_id':k[element].user_id, 'img_id':k[element].img_id});
											console.log("Photo removed");
											// Remove the photo from the folder /images
											fbii = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images/' + element);
											fbii.remove();
										}
									} 
									if(!kl){
										fb = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/dislikes/' + element);
										fb.update({'user_id':k[element].user_id, 'img_id':k[element].img_id});
										console.log("Photo removed");
										// Remove the photo from the folder /images
										fbii = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images/' + element);
										fbii.remove();
									}
								})
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
	methods: {
		parse : function(uid,imgid) {
			var link = 'https://intense-fire-5524.firebaseio.com/pola/' + uid + '/'  + imgid + '/filePayload.json';
			// Parsing JSON form URL
			$.ajax({
	            type: 'GET',
	            url: link,
	            async: true,
	            contentType: "application/json",
	            dataType: 'json',
	            success: function (json) {
	            	// Print to image after we've parsed
	            	$("#" + imgid).attr("style","background-image: url(" + json + "); display: block;");
	            }, error: function (e) {
	                console.log("error loading saved picture" + imgid);
	           	}
        	});
        	// While we wait for the parsing, display a loading icon
        	return "resources/wait.png";
    	}
	},
	template: `
		<div class="row row-hv-centered" id="savedPhotos">
			<div class="col-md-12 col-xs-12 col-lg-12 center-content no-margin-no-padding">
				<ul id="savedList">
					<li v-for="photo in savedfriendsphotos" class="photoFrame">
						<img class="polaroid" id ="{{photo.img_id}}" v-bind:style="{ backgroundImage: 'url(' + parse(photo.user_id,photo.img_id)  + ')', display:block}">
						{{photo.caption}}
						</img>
					</li>
				</ul>
			</div>
		</div>
	`
});

/****** SEARCH-FOLLOW USER COMPONENT *******/
var searchComponent = Vue.extend({
	props: ['usr','followinglist', 'followerslist'],
	template: `
		<div class="row row-hv-centered" id="search">
			<div class="center-content margin-bottom">
				<input type="text" id="inputSearchUser" class="form-control" @keyup.enter="searchUser()" placeholder="example@gmail.com">
			</div>
			
			<div class="col-md-12 col-xs-12 col-lg-12 center-content">
				<button type="button" class="btn btn-default btn-info quicksand" id="upload" @click="searchUser()">
					Search
				</button>

				<div id="searchResults" v-if="(searching)">
					<h3>Results</h3>
					<p>
						<span v-if='foundUser && endLoop'>
							{{ inputEmail }} :
							<span v-if="followDone">
								<button class="btn btn-default btn-info quicksand" @click="followUser()">Unfollow</button>
							</span>
							<span v-else>
								<button class="btn btn-default btn-success quicksand" @click="followUser()">Follow</button>
							</span>
						</span> 
						<span v-if='!foundUser && endLoop'> {{ inputEmail }} : Check the email address. User not found or you enter your email.</span> 
						<span v-if='!endLoop'><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i><span class="sr-only">Loading...</span></span>
					</p>
				</div>

			</div>

			<div class="col-md-12 col-xs-12 col-lg-12 center-content" style="margin-top: 5vh;">
				<h3>People you already follow</h3>
				<ul class="no-margin-no-padding f-ul">
					<li class="f-list" v-for="people in followinglist">{{people[".value"]}}</li>
				</ul>
			</div>

			<div class="col-md-12 col-xs-12 col-lg-12 center-content" style="margin-top: 5vh;">
				<h3>Followers</h3>
				<ul class="no-margin-no-padding f-ul">
					<li class="f-list" v-for="people in followerslist">{{people[".value"]}}</li>
				</ul>
			</div>


			
		
			
			
		</div>
	`,
	data: function(){
		return {
			following: "",
			inputEmail: "",
			searching: false,
			followDone: "",
			foundUser: false,
			followingEmail: "",
			followerEmail: "",
			followers:[],
			followings:[],
			noFollowers:"",
			noFollowersMsg:"",
			endLoop:false,
			noFollowings:"",
			noFollowingsMsg:""
		}
	},
	methods:{
		//Search a user by email
		searchUser: function(){
			var self = this;
			self.searching = true;
			self.inputEmail = $('#inputSearchUser').val();
			if( self.inputEmail != null ){ 
				self.loadRecord(self.inputEmail);  
			}
			else { 
				alert('Please write an email'); 
			}
		},
		//Search for the email in the data under users
		loadRecord: function(email) {
			var self = this;
			self.endLoop= false;
			self.foundUser = false;
			ref.child('users/').once('value', function (snap) {
				var users =snap.val();
				var item = 0;
				//search for the user with that email, If I found him I save id of follower, following
				//Check that the user doesnt enter his email
				Object.getOwnPropertyNames(users).forEach(function(element,index,array) {
					if (users[element].email == email && element != self.usr) {
						console.log("found");
						self.foundUser = true;
						self.following = element;
						// Check if you already follow that user (look for following userId unde the follower userId)
						new Firebase(ref + "list/" + self.usr).once("value",function(snapshot) {
							if (snapshot.child(self.following).exists()) { // if there is a record
								self.followDone = true;
			 					self.searching = true;
			 					self.endLoop = true;
			 					console.log("following");
							} else { //record = false (user doesnt follow him anymore)
				 				self.followDone = false;
				 				self.searching = true;
				 				self.endLoop = true;
				 				console.log("not following")
				 			}
						});
					} else {
						if (item == array.length -1 && !self.foundUser)
							{
								self.endLoop = true;
							}
						item++
					}
				});
			});
		},
		// Follow a user
		followUser: function(){
			var self = this;
			var mail;
			if (self.followDone) { // Unfollow
				self.endLoop = false;
				ref.child('/list/' + self.usr + '/' + self.following).remove(function(error) {
					if (error) {
						alert("Couldn't unfollow");
					} else {
						self.followDone = false;
					}
					self.endLoop = true;
				});
				ref.child('/followers/' + self.following + '/' + self.usr).remove(function(error) {
					if (error) {
						alert("Couldn't unfollow");
					} else {
						self.followDone = false;
					}
					self.endLoop = true;
				});
			} else { // Follow
				self.endLoop = false;
				//fetch email
				var fb1 = new Firebase(ref + "/users");
				fb1.once("value", function(snapshot){
					var tempEmail = snapshot.child(self.following + "/email");
					mail = tempEmail.val();
					var temp2Email = snapshot.child(app.usr + "/email");
					mail2 = temp2Email.val();
					//save email of the person that you follow
					ref.child('/list/' + self.usr + '/' + self.following).set(mail,function(error) {
						if (error) {
							alert("Couldn't follow user");
						} else {
							self.followDone = true;
						}
						self.endLoop = true;
					});
					//save the app.usr email in the followers
					ref.child('/followers/' + self.following + '/' + self.usr).set(mail2,function(error) {
						if (error) {
							alert("Couldn't save follower user");
						} else {
							self.followDone = true;
						}
						self.endLoop = true;
					});
				});
				
			}
		},
	}
});


/******* LOGGED COMPONENT *******/
var loggedComponent = Vue.extend({
	props: ['usr','photos','friendsphotos','savedfriendsphotos', 'followinglist','followerslist'],
	data: function() {
		return {
			currentView: 'upload-component',
			url: "",
			caption: ""
		}
	},
	template: `
		<div id="head" class="row">
			<div class="col-md-4 col-md-offset-4 col-xs-6 col-xs-offset-3 col-lg-4 col-lg-offset-4" id="title-bar">
				<h4>
					{{
						(currentView == 'my-friends-feed-component') ? 'Home' : 
						(currentView == 'search-component') ? "Users" : 
						(currentView == 'upload-component') ? "New" : 
						(currentView == 'saved-photos-component') ? "Likes" : 
						"Uploads" 
					}}
				</h4>
				<h4 v-if="currentView=='my-friends-feed-component' && friendsphotos.length > 0" style="color: #888888;">
					&nbsp;<span class="fa fa-question-circle" data-toggle="tooltip" title="Swipe right to save picture, left to discard" data-placement="bottom" id="toolt"></span>
				</h4>
			</div>
		</div>
		<component  :is="currentView" keep-alive :usr="usr" :url.sync="url" :photos="photos" :current-view.sync="currentView" :friendsphotos="friendsphotos" :savedfriendsphotos="savedfriendsphotos" :followinglist="followinglist" :followerslist="followerslist" :caption.sync="caption">
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
		usr: "",
		spinner:""
	}, 
	ready: function() {
		 // Hide the loading message
		$.mobile.loading().hide();
		// Binding the tooltip
		$('body').tooltip({
    		selector: '#toolt'
		});
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
	app.$bindAsArray("photos",new Firebase( 'https://intense-fire-5524.firebaseio.com/pola/' + app.usr).limitToLast(10));
}

// Fetching the user's friends' feeds
function fetchFriendFeed() {
	app.$bindAsArray("friendsphotos",new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + "/images").limitToLast(10));
}

// Fetching the user's likes
function fetchSavedFriendFeed() {
	// Fetching friends photos
		// New folder: list 
		fbl = new Firebase('https://intense-fire-5524.firebaseio.com/list/' + app.usr);
		fbf = new Firebase('https://intense-fire-5524.firebaseio.com/pola/');
		// New folder in Firebase: savedData
		sd_images = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/images');
		sd_likes = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/likes');
		sd_dislikes = new Firebase('https://intense-fire-5524.firebaseio.com/savedData/' + app.usr + '/dislikes');

		// Look for who follows the app.usr
		fbl.on('value', function (snap) {
	 		var k=snap.val();
	 		console.log(k);
	 		if(k){
	 		Object.getOwnPropertyNames(k).forEach(function(element,index,array){
	 			// 'element' is every id-user that app.usr may follow
	 				// Fetch the photos from the followed user
	 				fbf.child(element).on('value', function (snapf) {
	 					var kf = snapf.val(); // list of pictures of 'element' user	 					

	 					// Check if photos are not already in the images, likes or dislikes folder of this user
	 					Object.getOwnPropertyNames(kf).forEach(function(elementf) {
	 						// 'elementf' is the id of each photo
	 						var already = false;

	 						// IMAGES folder
	 						sd_images.once('value', function (snapi){
	 							var ki = snapi.val();
	 							if(ki){
	 								Object.keys(ki).forEach(function (elementi){
	 									if(ki[elementi].img_id == elementf){
	 										already = true;
	 									}
	 								});
	 							}
		 						// LIKES folder
		 						sd_likes.once('value', function (snapl){
		 							var kl = snapl.val();
		 							if(kl){
		 								Object.keys(kl).forEach(function(elementl) {
			 								if(kl[elementl].img_id == elementf){	
			 									already = true;
			 								}
			 							});
		 							}
			 						// DISLIKES folder
			 						sd_dislikes.once('value', function(snapd) {
			 							var kd = snapd.val();
			 							if(kd){
			 								Object.keys(kd).forEach(function(elementd) {
				 								if(kd[elementd].img_id == elementf){
				 									already = true;
				 								}
				 							});
			 							}
			 							if(!already){
											sd_images.push({'user_id':element, 'img_id':elementf, 'caption': kf[elementf].caption});
											console.log("Image added");
										} 	
			 						});			 							
		 						});

	 						});						
	 					});
	 					
	 				});
	 		});
 		}
		});
 	app.$bindAsArray("savedfriendsphotos", sd_likes);
}

// Fetch the people that you follow
function fetchFollowingList() {
	app.$bindAsArray("followinglist",new Firebase( 'https://intense-fire-5524.firebaseio.com/list/' + app.usr).limitToLast(30));
}

// Fetch followers
function fetchFollowersList() {
	app.$bindAsArray("followerslist",new Firebase( 'https://intense-fire-5524.firebaseio.com/followers/' + app.usr).limitToLast(30));
}

// Callback checking if we have authentified. Authentication persists 24H by default
function authDataCallback(authData) {
	if (authData) {
		app.usr = authData.uid;
		fetchUserFeed();
		fetchFriendFeed();
		fetchSavedFriendFeed();
		fetchFollowingList();
		fetchFollowersList();
		app.logged = true;
	} else {
		app.usr = "";
		app.logged = false;
	}
}

ref.onAuth(authDataCallback);