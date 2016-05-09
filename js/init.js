var url = new Firebase('https://intense-fire-5524.firebaseio.com/');
var items = new Firebase('https://intense-fire-5524.firebaseio.com/pola')

var app = new Vue({
	el: '#app',
	data: {
		message: "please upload a file"
	},
	firebase: {
		photos: items.limitToLast(5)
	},
	methods: {
		uploadPhoto: function() {
			var self = this;
			self.message= "uploading";
			var file = $("#snapPola")[0].files[0];
			var fileType = /image.*/;
			if (file.type.match(fileType)) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var img = new Image();
					img.src = reader.result;
					var hash = CryptoJS.SHA256(Math.random() + CryptoJS.SHA256(img.src));
					var f = new Firebase(url + "pola/" + hash + '/filePayload');
					f.set(img.src,function() {
						self.message="uploaded";
						$("#url")[0].src=img.src;
					});
				}
				reader.readAsDataURL(file); 
			} else {
					alert("File not supported !");
			}
		}
	}
});