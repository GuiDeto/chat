function getUserMedia(options, successCallback, failureCallback) {
    var api = navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (api) {
        return api.bind(navigator)(options, successCallback, failureCallback);
    }
}

var pc1;
var pc2;
var theStreamB;

function getStream() {
    if (!navigator.getUserMedia && !navigator.webkitGetUserMedia &&
        !navigator.mozGetUserMedia && !navigator.msGetUserMedia) {
        alert('User Media API not supported.');
        return;
    }

    var constraints = {
        video: true
    };
    getUserMedia(constraints, function (stream) {
        addStreamToVideoTag(stream, 'localVideo');

        // RTCPeerConnection is prefixed in Blink-based browsers.
        window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        pc1 = new RTCPeerConnection(null);
        pc1.addStream(stream);
        pc1.onicecandidate = event => {
            if (event.candidate == null) return;
            pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
        };

        pc2 = new RTCPeerConnection(null);
        pc2.onaddstream = event => {
            theStreamB = event.stream;
            addStreamToVideoTag(event.stream, 'remoteVideo');
        };
        pc2.onicecandidate = event => {
            if (event.candidate == null) return;
            pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
        };

        pc1.createOffer({
                offerToReceiveVideo: 1
            })
            .then(desc => {
                pc1.setLocalDescription(desc);
                pc2.setRemoteDescription(desc);
                return pc2.createAnswer({
                    offerToReceiveVideo: 1
                });
            })
            .then(desc => {
                pc1.setRemoteDescription(desc);
                pc2.setLocalDescription(desc);
            })
            .catch(err => {
                console.error('createOffer()/createAnswer() failed ' + err);
            });
    }, function (err) {
        alert('Error: ' + err);
    });
}

function addStreamToVideoTag(stream, tag) {
    var mediaControl = document.getElementById(tag);
    if ('srcObject' in mediaControl) {
        mediaControl.srcObject = stream;
    } else if (navigator.mozGetUserMedia) {
        mediaControl.mozSrcObject = stream;
    } else {
        mediaControl.src = (window.URL || window.webkitURL).createObjectURL(stream);
    }
}