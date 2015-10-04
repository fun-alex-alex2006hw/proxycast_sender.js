var chrome = {};

chrome.cast = {

	isAvailable: false,

	media: {
		DEFAULT_MEDIA_RECEIVER_APP_ID: 'CC1AD845',

		MetadataType: {
			GENERIC: 0, TV_SHOW: 1, MOVIE: 2, MUSIC_TRACK: 3, PHOTO: 4
		},

		PlayerState: {
			IDLE: "IDLE", PLAYING: "PLAYING", PAUSED: "PAUSED", BUFFERING: "BUFFERING"
		},

		MediaInfo: function(contentId) {
			this.contentId = contentId;
			this.streamType = "BUFFERED";
		},

		GenericMediaMetadata: function() {
			this.type = 0;
		},

		LoadRequest: function(media) {
			this.media = media;
			this.activeTrackIds = [];
		},

		GenericMediaMetadata: function() {
			this.metadataType = this.type = chrome.cast.media.MetadataType.GENERIC;
			this.releaseDate = this.releaseYear = this.images = this.subtitle = this.title = null;
		},

		TrackType: {
			TEXT:"TEXT", AUDIO:"AUDIO", VIDEO:"VIDEO"
		},
		TextTrackType: {
			SUBTITLES:"SUBTITLES", CAPTIONS:"CAPTIONS", DESCRIPTIONS:"DESCRIPTIONS", CHAPTERS:"CHAPTERS", METADATA:"METADATA"
		},
		TextTrackEdgeType: {
			NONE:"NONE", OUTLINE:"OUTLINE", DROP_SHADOW:"DROP_SHADOW", RAISED:"RAISED", DEPRESSED:"DEPRESSED"
		},
		TextTrackWindowType: {
			NONE:"NONE", NORMAL:"NORMAL", ROUNDED_CORNERS:"ROUNDED_CORNERS"
		},
		TextTrackFontGenericFamily: {
			SANS_SERIF:"SANS_SERIF", MONOSPACED_SANS_SERIF:"MONOSPACED_SANS_SERIF", SERIF:"SERIF", MONOSPACED_SERIF:"MONOSPACED_SERIF", CASUAL:"CASUAL", CURSIVE:"CURSIVE", SMALL_CAPITALS:"SMALL_CAPITALS"
		},
		TextTrackFontStyle: {
			NORMAL:"NORMAL", BOLD:"BOLD", BOLD_ITALIC:"BOLD_ITALIC", ITALIC:"ITALIC"
		},

		TextTrackStyle: function() {
			// adding below line makes parameter=null being sent to the proxy, which in turn make subtitles not appear
			//this.customData = this.fontStyle = this.fontGenericFamily = this.fontFamily = this.fontScale = this.windowRoundedCornerRadius = this.windowColor = this.windowType = this.edgeColor = this.edgeType = this.backgroundColor = this.foregroundColor = null;
		},

		Track: function(trackId, type) {
			this.trackId = trackId;
			this.trackContentType = this.trackContentId = null;
			this.type = type;
			this.customData = this.subtype = this.language = this.name = null;
		},


		VolumeRequest: function(volume) {
			this.volume = volume;
		},

		SeekRequest: function(seekRequest) {
			this.seekRequest = seekRequest;
		},

		EditTracksInfoRequest: function(opt_activeTrackIds, opt_textTrackStyle) {
			this.activeTrackIds = opt_activeTrackIds;
			this.textTrackStyle = opt_textTrackStyle;
		},

		
		OldMedia: function(media, sessionId, receiverId) {
			this.sessionId = sessionId;
			this.receiverId = receiverId;
			this.update(media);
			this.updateListeners = [];
		},

		Media: function(sessionId, mediaSessionId, receiverId) {
			this.sessionId = sessionId;
			this.mediaSessionId = mediaSessionId;
			this.media = null;
			this.playbackRate = 1;
			this.playerState = chrome.cast.media.PlayerState.IDLE;
			this.currentTime = 0;
			this.supportedMediaCommands = [];
			this.volume = new chrome.cast.Volume();
			this.customData = this.activeTrackIds = this.idleReason = null;
			this.updateListeners = [];
			this.receiverId = receiverId;
		}


	},

	Volume: function(level, mute) {
		this.mute = mute;
		this.level = level;
	},

	Error: {
		CANCEL:"cancel", TIMEOUT:"timeout", API_NOT_INITIALIZED:"api_not_initialized",
		INVALID_PARAMETER:"invalid_parameter", EXTENSION_NOT_COMPATIBLE:"extension_not_compatible",
		EXTENSION_MISSING:"extension_missing", RECEIVER_UNAVAILABLE:"receiver_unavailable",
		SESSION_ERROR:"session_error", CHANNEL_ERROR:"channel_error", LOAD_MEDIA_FAILED:"load_media_failed"
	},

	SessionStatus: {
		CONNECTED:"connected", DISCONNECTED:"disconnected", STOPPED:"stopped"
	},

	ReceiverAvailability: {
		AVAILABLE:"available", UNAVAILABLE:"unavailable"
	},

	AutoJoinPolicy: {
		PAGE_SCOPED: "page_scoped",
		TAB_AND_ORIGIN_SCOPED: "tab_and_origin_scoped",
		ORIGIN_SCOPED: "origin_scoped"
	},


	SessionRequest: function(appId) {
		this.appId = appId;
	},

	ApiConfig: function(sessionRequest, sessionListener, receiverListener, autoJoinPolicy) {
		this.sessionRequest = sessionRequest;
		this.sessionListener = sessionListener;
		this.receiverListener = receiverListener;
		this.autoJoinPolicy = autoJoinPolicy;
	},

	OldSession: function(session) {
		this.media = [];
		this.namespaces = [];
		this.updateListeners = [];
		this.mediaListeners = [];
		this.listener = null; // used to deregister callback
		this.status = chrome.cast.SessionStatus.CONNECTED;
		this.update(session);
	},


	Session: function(sessionId, appId, displayName, appImages, receiver) {
		this.sessionId = sessionId;
		this.appId = appId;
		this.displayName = displayName;
		this.statusText = null;
		this.appImages = appImages;
		this.receiver = receiver;
		this.senderApps = [];
		this.namespaces = [];
		this.media = [];
		this.status = chrome.cast.SessionStatus.CONNECTED;
		this.transportId = "";
		this.updateListeners = [];
		this.mediaListeners = [];
		this.listener = null; // used to deregister callback
	},

	Volume: function(opt_level, opt_muted) {
		this.level = opt_level;
		this.muted = opt_muted;
	},

	ReceiverType: {
		CAST:"cast", DIAL:"dial", HANGOUT:"hangout", CUSTOM:"custom"
	},
	Receiver: function(label, friendlyName, opt_capabilities, opt_volume) {
		this.label = label;
		this.friendlyName = friendlyName;
		this.capabilities = opt_capabilities || [];
		this.volume = opt_volume || null;
		this.receiverType = chrome.cast.ReceiverType.CAST;
		this.displayStatus = this.isActiveInput = null;
	},

	initialize: function(apiConfig, onSuccess, onError) {
		chrome.cast.getMessagesSeqNo = 0;
		chrome.cast.defaultApiConfig = apiConfig;
		chrome.cast.connectListeners = [];
		chrome.cast.selectDeviceList = [];
		chrome.cast.selectDevicePopup = null;
		chrome.cast.selectDeviceOnError = null;
		chrome.cast.selectDeviceOnSuccess = null;
		setTimeout(function() { // simulate asynchronous call
			apiConfig.receiverListener("available");
			onSuccess();
		},0);
	},

	joinSession: function() {
		chrome.cast.sendNoReply({ 
			receiverId: null,  // need to be web-XXX but not sure how to get it
			namespace: 'urn:x-cast:com.google.cast.media', 
			payload: { type: 'GET_STATUS', requestId: null }
			}, function() {
		}, onError);
		
	},

	requestSession: function(onSuccess, onError, optApiConfig) {
		var self = this;
		var apiConfig = chrome.cast.defaultApiConfig || optApiConfig;
			
		chrome.cast.send({ 
			receiverId: 'receiver-0', 
			namespace: 'urn:x-cast:com.google.cast.receiver', 
			payload: { type: 'LAUNCH', requestId: null, appId: apiConfig.sessionRequest.appId } }, function(reply) {
				var session = new chrome.cast.Session(
					reply.payload.status.applications[0].sessionId, reply.payload.status.applications[0].appId, 
					reply.payload.status.applications[0].displayName, reply.payload.status.applications[0].appImages,
					new chrome.cast.Receiver("receiver-0", chrome.cast.selectDeviceList[chrome.cast.selectDeviceSelected].name, null,
						chrome.cast.Volume(reply.payload.status.volume.level, reply.payload.status.volume.muted))
				);
				console.log("LAUNCH reply");
				session.transportId = reply.payload.status.applications[0].transportId;
				chrome.cast.messageListeners.push( session.listener = function(reply) { return session.messageListener(reply); } );
				chrome.cast.sendNoReply({ 
					receiverId: reply.payload.status.applications[0].transportId, 
					namespace: 'urn:x-cast:com.google.cast.tp.connection', 
					payload: { type: 'CONNECT' }
					}, function() {
						onSuccess(session);
				}, onError);
		}, onError);

	},

	arrayFilter: function(array, condition) {
		var i, ret = [];
		for(i = 0 ; i < array.length ; ++i) {
			if(condition(array[i]))
				ret.push(array[i]);
		}
		console.log("ArrayFilter %s to %s", array.length, ret.length );
		return ret;
	},

	selectDevicePopup: null,
	selectDeviceList: [],
	selectDeviceOnSuccess: null,
	selectDeviceOnError: null,
	selectDeviceSelected : -1,
	selectDeviceCallback: function(index) {
		document.body.removeChild(chrome.cast.selectDevicePopup);
		chrome.cast.selectDevicePopup = null;
		if(index >= 0) {
			console.log("selectDeviceCallback: success");
			chrome.cast.selectDeviceSelected = index;
			chrome.cast.selectDeviceOnSuccess();
		} else {
			console.log("selectDeviceCallback: cancel");
			chrome.cast.selectDeviceOnError(chrome.cast.CANCEL);
		}
	},
	selectDevice: function(onSuccess, onError) {
		if(chrome.cast.selectDevicePopup) return; // do not double call
		chrome.cast.selectDeviceList = [];
		chrome.cast.selectDeviceOnSuccess = onSuccess;
		chrome.cast.selectDeviceOnError = onError;
		var 	popup = document.createElement('div'),
				table = document.createElement('table'),
				row,
					cell,
						device,
							deviceText,
				cancel = document.createElement('button'),
					cancelText = document.createTextNode("Cancel");

		popup.style.cssText = 'position:absolute;width:100%;height:100%;opacity:1;z-index:100;background:gray;';

		cancel.appendChild(cancelText);
		cancel.setAttribute("type","button");
		cancel.setAttribute("onclick","javascript:chrome.cast.selectDeviceCallback(-1);");
		cancel.style.cssText = 'color:blue;background:white;opacity:1;display:block;text-align:center;';
		
		popup.appendChild(table);
		popup.appendChild(cancel);
		document.body.appendChild(popup);
		console.log("popup added");
		chrome.cast.selectDevicePopup = popup;

		var listener = function(reply) {
			console.log("received reply to discover message");
			if(chrome.cast.selectDevicePopup && reply.namespace === "/proxycast/discover" && reply.payload != null) {
				chrome.cast.selectDeviceList.push( reply.payload );
				row = table.insertRow(table.rows.length);
				cell = row.insertCell(0);
				device = document.createElement('button');
				deviceText = document.createTextNode(reply.payload.name);
				device.appendChild(deviceText);
				device.setAttribute("onclick","javascript:chrome.cast.selectDeviceCallback("+(table.rows.length-1)+");");
				cell.appendChild(device);
				console.log("inserted row %s", reply.payload.name);
			}
			return (!chrome.cast.selectDevicePopup) || (reply.namespace ==! "/proxycast/discover") || (reply.payload != null);
		}
		chrome.cast.messageListeners.push(listener);
		chrome.cast.httpRequest("/proxycast/discover", "POST", null, function(ret, status) {
			if(status == 200) {
				chrome.cast.getMessages(); // re-enable if it is not enabled
			} else {
				console.log("using array filter 1");
				chrome.cast.messageListeners = chrome.cast.arrayFilter(chrome.cast.messageListeners, function(item){ return (item != listener); });

			}
		});



	},

	connectListeners: [],

	sendNoReply: function(data, onSuccess, onError) {
		chrome.cast.httpRequest("/proxycast/send", "POST", data, function(ret, status) {
			console.log("sent message requestId %s: %d", data.payload.requestId || "<undefined>", status);
			if(status == 200) {
				if(ret.status === "ERROR" && ret.code === "DISCONNECTED") {
					chrome.cast.connectListeners.push( function(status, error) {
						if(status === "OK") chrome.cast.sendNoReply(data, onSuccess, onError);
						else onError(error);
					});
					if(chrome.cast.connectListeners.length === 1) { // if not already trying to connect
						chrome.cast.selectDevice( function(address) {
							console.log("Trying to connect");
							chrome.cast.httpRequest("/proxycast/connect", "POST", { address: chrome.cast.selectDeviceList[chrome.cast.selectDeviceSelected].ip }, function(ret, status) {
								var i, listeners = chrome.cast.connectListeners;
								chrome.cast.connectListeners = [];
								for(i = 0 ; i < listeners.length; ++i) {
									listeners[i](ret.status, ret.status === "OK" ? "" : chrome.cast.Error.RECEIVER_UNAVAILABLE);
								}
							});
						}, function(error) {
							var i, listeners = chrome.cast.connectListeners;
							chrome.cast.connectListeners = [];
							for(i = 0 ; i < listeners.length; ++i) {
								listeners[i]("ERROR", error);
							}
						});
					}
				}
				onSuccess();
				chrome.cast.getMessages(); // re-enable if it is not enabled
			} else {
				onError(chrome.cast.Error.RECEIVER_UNAVAILABLE);
			}
		});
	},

	send: function(data, onSuccess, onError) {
		chrome.cast.httpRequest("/proxycast/nextRequestId", "POST", null, function(ret, status) {
			var listener;
			if(status == 200) {
				if(data.payload.requestId === null) data.payload.requestId = ret.requestId;
				if(onSuccess) {
					if(!data.payload.requestId) throw new Error("Can't execute onSuccess callback when no requestId provided");
					listener = function(reply) {
						if(reply.payload && data.payload.requestId == reply.payload.requestId) {
							console.log("received reply to message %d", reply.payload.requestId);
							onSuccess(reply);
							return false;
						} else {
							console.log("waiting for message %s but received %s", data.payload.requestId, reply.payload ? reply.payload.requestId : "");
						}
						return true;
					};
					chrome.cast.messageListeners.push(listener);
				}
				chrome.cast.httpRequest("/proxycast/send", "POST", data, function(ret, status) {
					console.log("sent message requestId %s: %d", data.payload.requestId || "<undefined>", status);
					if(status == 200) {
						if(ret.status === "ERROR" && ret.code === "DISCONNECTED") {
							chrome.cast.connectListeners.push( function(status, error) {
								if(status === "OK") chrome.cast.send(data, onSuccess, onError);
								else onError(error);
							});
							if(chrome.cast.connectListeners.length === 1) { // if not already trying to connect
								chrome.cast.selectDevice( function(address) {
									console.log("Trying to connect");
									chrome.cast.httpRequest("/proxycast/connect", "POST", { address: chrome.cast.selectDeviceList[chrome.cast.selectDeviceSelected].ip }, function(ret, status) {
										var i, listeners = chrome.cast.connectListeners;
										chrome.cast.connectListeners = [];
										for(i = 0 ; i < listeners.length; ++i) {
											listeners[i](ret.status, ret.status === "OK" ? "" : chrome.cast.Error.RECEIVER_UNAVAILABLE);
										}
									});
								}, function(error) {
									var i, listeners = chrome.cast.connectListeners;
									chrome.cast.connectListeners = [];
									for(i = 0 ; i < listeners.length; ++i) {
										listeners[i]("ERROR", error);
									}
								});
							}
						}
						chrome.cast.getMessages(); // re-enable if it is not enabled
					} else {
						onError(chrome.cast.Error.RECEIVER_UNAVAILABLE);
					}
					if(status != 200 || ret.status === "ERROR") { // remove the requestId listener
						console.log("using array filter 2");
						chrome.cast.messageListeners = chrome.cast.arrayFilter(chrome.cast.messageListeners, function(item){ return (item != listener); });
					}
				});
			} else {
				onError(chrome.cast.Error.RECEIVER_UNAVAILABLE);
			}
		});
	},

	requestSessionById: function(id) {
		chrome.cast.httpRequest("/proxycast", { name: "chrome.cast.requestSessionById", args: [ id ] }, function(response) {
			onSuccess();
		});
	},

	onReceiverStatus: function(response) {
		
	},

	messageListeners: [],
	getMessagesRequest: null,
	getMessagesSeqNo: 0,	
	getMessages: function(retryCount) {
		if(chrome.cast.getMessagesRequest) return; // already running
		chrome.cast.getMessagesRequest = chrome.cast.httpRequest("/proxycast/message?seq=" + chrome.cast.getMessagesSeqNo, "GET", null, function(data, status) {
			var i, listeners, httpRequest = chrome.cast.getMessagesRequest;
			chrome.cast.getMessagesRequest = null;
			console.log("getMessages(%s): status: %s, listenersCount: %d", (retryCount || ""), status, chrome.cast.messageListeners.length);
			if (status == 200) {
				listeners = chrome.cast.messageListeners;
				chrome.cast.messageListeners = [];
				chrome.cast.getMessagesSeqNo = data.seqNo;
				for(i = 0 ; i < listeners.length; ++i) {
					if(listeners[i](data)) {
						chrome.cast.messageListeners.push(listeners[i]);
					}
				}
				chrome.cast.getMessages();
			} else {
				if(retryCount !== 5) {
					console.log("getMessages retrying");
					setTimeout(function() { 
						chrome.cast.getMessages( (retryCount || 0) + 1);
					}, 5000);
				} else {
					console.log("getMessages disabled due to response %s", status);
				}
			}
		});
		chrome.cast.getMessagesRequest.ontimeout = function() {
			console.log("timeout!!!");
		}
	},

	httpRequest: function(url, method, data, fun) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			var DONE = this.DONE || 4;
			if (this.readyState === DONE){
				console.log(request.responseText + ": " + request.status);
				if(fun)
					fun((request.status == 200) ? JSON.parse(request.responseText) : null, request.status);
			}
		};
		request.open(method, url, true);
		request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');		// Tells server that this call is made for ajax purposes.
		request.setRequestHeader("Content-type", "application/json; charset=utf-8");
		request.send(data ? JSON.stringify(data) : null);
		console.log("httpRequest: %s %s, data: %s", method, url, JSON.stringify(data));
		return request;
	}

};


setTimeout(function() {
	chrome.cast.isAvailable = true;
}, 300);
chrome.cast.getMessagesSeqNo = 0;

// chrome.cast.Session


// void addMediaListener(listener)
// Adds a listener that is invoked when a media session is created by another sender.

// void addUpdateListener(listener)
//Adds a listener that is invoked when the Session has changed. Changes to the following properties will trigger the listener: statusText, namespaces, status, and the volume of the receiver.
//Listeners should check the status property of the Session to determine its connection status. The boolean parameter isAlive is deprecated in favor of the status Session property. The isAlive parameter is still passed in for backwards compatibility, and is true unless status = chrome.cast.SessionStatus.STOPPED.

chrome.cast.Session.prototype.messageListener = function(message) {
	var self = this;
	if(message.namespace != "urn:x-cast:com.google.cast.receiver" && message.namespace != "urn:x-cast:com.google.cast.media") return true;
	console.log("chrome.cast.Session.prototype.messageListener");
	if(message.payload.type == "MEDIA_STATUS" && message.payload.status && message.payload.status[0] && message.senderId !== self.transportId) {
		console.log("chrome.cast.Session.messageListener: notifying update to %d mediaListeners", self.mediaListeners.length);
		var media = new chrome.cast.media.Media(self.sessionId, reply.payload.status[0].mediaSessionId, message.senderId);
		media.update(message.payload.status[0]);
		self.media[0] = media;
		for(var i = 0 ; i < self.mediaListeners.length ; ++i) {
			self.mediaListeners[i](media);
		}
	}
	if(message.payload.type == "RECEIVER_STATUS" && message.payload.status && message.payload.status[0] && message.senderId === self.transportId) {
		console.log("chrome.cast.Session.messageListener: notifying update to %d updateListeners", self.updateListeners.length);
		self.update(message.payload.status[0]);
		for(var i = 0 ; i < self.updateListeners.length ; ++i) {
			self.updateListeners[i](self.status != chrome.cast.SessionStatus.STOPPED);
		}
	}
	if(self.media[0] && message.senderId === self.transportId) {
		console.log("chrome.cast.Session.messageListener: forward message to current media");
		self.media[0].messageListener(message);
	}
	return true;
}


chrome.cast.Session.prototype.update = function(session) {
	this.appId = session.appId || this.appId;
	this.transportId = session.transportId || this.transportId;
	this.appImages  = session.appImages || this.appImages;
	this.displayName = session.displayName || this.displayName;
	this.namespaces = session.namespaces || this.namespaces;
	this.senderApps = session.senderApps || this.senderApps;
	this.statusText = session.statusText || this.statusText;
}

chrome.cast.Session.prototype.addMediaListener = function(mediaListener) {
	this.mediaListeners.push(mediaListener);
}

chrome.cast.Session.prototype.addUpdateListener = function(updateListener) {
	this.updateListeners.push(updateListener);
}

chrome.cast.Session.prototype.removeUpdateListener = function(updateListener) {
	this.updateListeners = chrome.cast.arrayFilter(this.updateListeners, function(item){ return (item != updateListener); });
}
chrome.cast.Session.prototype.stop = function(onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: 'receiver-0', 
		namespace: 'urn:x-cast:com.google.cast.receiver', 
		payload: { type: 'STOP', requestId: null, sessionId: self.sessionId } }, function(reply) {
				self.status = chrome.cast.SessionStatus.STOPPED;
				onSuccess();
	}, onError);
	chrome.cast.messageListeners = chrome.cast.arrayFilter(chrome.cast.messageListeners, function(item){ return (item != self.listener); });

}
chrome.cast.Session.prototype.loadMedia = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.transportId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'LOAD', requestId: null, sessionId: self.sessionId, media: request.media, autoplay: request.autoplay, currentTime: request.currentTime, activeTrackIds: request.activeTrackIds } }, function(reply) {
		//payload: { type: 'LOAD', requestId: null, sessionId: self.sessionId, media: request.media, autoplay: request.autoplay, currentTime: request.currentTime } }, function(reply) {
			if(reply.payload.type == "MEDIA_STATUS") {
				var media = new chrome.cast.media.Media(self.sessionId, reply.payload.status[0].mediaSessionId, reply.senderId);
				media.update(reply.payload.status[0]);
				self.media[0] = media;
				//using receiver listener instead;
				//chrome.cast.messageListeners.push( function(reply) { return media.messageListener(reply); } );
				onSuccess(media);
			} else {
				onError(chrome.cast.Error.LOAD_MEDIA_FAILED);
			}
	}, onError);
}
chrome.cast.Session.prototype.setReceiverVolumeLevel = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: 'receiver-0', 
		namespace: 'urn:x-cast:com.google.cast.receiver', 
		payload: { type: 'SET_VOLUME', requestId: null, volume: { level: request }, expectedVolume: { level: request, muted: false } } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.Session.prototype.setReceiverMuted = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: 'receiver-0', 
		namespace: 'urn:x-cast:com.google.cast.receiver', 
		payload: { type: 'SET_VOLUME', requestId: null, volume: { muted: request }, expectedVolume: { level: 1, muted: !request } } }, function(reply) {
			onSuccess();
	}, onError);
}



// chrome.cast.media.Media
chrome.cast.media.Media.prototype.messageListener = function(reply) {
	var self = this;
	if(reply.payload.status && reply.payload.status[0]) {
		self.update(reply.payload.status[0]);
		console.log("chrome.cast.media.Media.messageListener: notifying media update to %d listeners", self.updateListeners.length);
		for(var i = 0 ; i < self.updateListeners.length ; ++i) {
			self.updateListeners[i](reply.payload.status[0].playerState != "IDLE");
		}
	}
	return true;				
}
chrome.cast.media.Media.prototype.addUpdateListener = function(updateListener) {
	this.updateListeners.push(updateListener);
}
chrome.cast.media.Media.prototype.getEstimatedTime = function() {
	var currentDate = (new Date());
	if(this.playerState == chrome.cast.media.PlayerState.PLAYING) {
		return this.currentTime + (currentDate.getTime() - this.updateTimestamp.getTime())*this.playbackRate/1000;
	} else {
		return this.currentTime;
	}
}
chrome.cast.media.Media.prototype.update = function(media) {
	this.activeTrackIds = media.activeTrackIds || this.activeTrackIds;
	this.currentTime = media.currentTime || this.currentTime;
	this.customData = media.customData || this.customData;
	this.idleReason = media.idleReason || this.idleReason;
	this.media = media.media || this.media;
	this.mediaSessionId = media.mediaSessionId || this.mediaSessionId;
	this.playbackRate = media.playbackRate || this.playbackRate;
	this.playerState = media.playerState || this.playerState;
	this.sessionId = media.sessionId || this.sessionId;
	this.supportedMediaCommands = media.supportedMediaCommands || this.supportedMediaCommands;
	this.volume = media.volume || this.volume;
	if(media.currentTime !== undefined) this.updateTimestamp = (new Date());
}
chrome.cast.media.Media.prototype.getStatus = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'GET_STATUS', requestId: null, sessionId: self.sessionId, mediaSessionId: self.mediaSession } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.play = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'PLAY', requestId: null, sessionId: self.sessionId, mediaSessionId: self.mediaSessionId } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.pause = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'PAUSE', requestId: null, sessionId: self.sessionId, mediaSessionId: self.mediaSessionId } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.stop = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'STOP', requestId: null, sessionId: self.sessionId, mediaSessionId: self.mediaSessionId } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.setVolume = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: 'receiver-0', 
		namespace: 'urn:x-cast:com.google.cast.receiver', 
		payload: { type: 'SET_VOLUME', requestId: null, expectedVolume: request.volume } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.seek = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'SEEK', requestId: null, sessionId: self.sessionId, mediaSessionId: self.mediaSessionId, currentTime: request.currentTime } }, function(reply) {
			onSuccess();
	}, onError);
}
chrome.cast.media.Media.prototype.editTracksInfo = function(request, onSuccess, onError) {
	var self = this;
	chrome.cast.send({ 
		receiverId: self.receiverId, 
		namespace: 'urn:x-cast:com.google.cast.media', 
		payload: { type: 'EDIT_TRACKS_INFO', requestId: null, activeTrackIds: request.activeTrackIds, textTrackStyle: request.textTrackStyle, sessionId: self.sessionId, mediaSessionId: self.mediaSessionId } }, function(reply) {
			onSuccess();
	}, onError);
}

console.log("module loaded!");

