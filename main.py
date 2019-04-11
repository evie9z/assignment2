import face_recognition
from sklearn.externals import joblib
from skimage import feature, filters, color
import cv2
from flask import Flask, render_template, request, jsonify
import numpy
import urllib
from PIL import Image
import io
import re
import base64

frame = None

app = Flask(__name__)

def nothing(x):
    pass

# Learn how to recognize a specific person's face.
evie_image = face_recognition.load_image_file("./training data/yewei_0.png")
evie_face_encoding = face_recognition.face_encodings(evie_image)[0]

# Learn to recognize another person.
zoff_image = face_recognition.load_image_file("./training data/zoff_0.png")
zoff_face_encoding = face_recognition.face_encodings(zoff_image)[0]

# Create arrays of known face encodings and their names
known_face_encodings = [
    evie_face_encoding,
    zoff_face_encoding
]
known_face_names = [
    "Evie",
    "Zoff"
]

# Get keyClassifier from another python file
classifier = joblib.load('classifier_hog.joblib')

def url_to_image(url):
  imgstr = re.search(r'base64,(.*)', url).group(1)
  image_bytes = io.BytesIO(base64.b64decode(imgstr))
  im = Image.open(image_bytes)
  image = numpy.array(im)
  return image

@app.route('/', methods=['POST'])
def detect_faces():

    # Initialize some variables
    face_locations = []
    face_encodings = []
    face_names = []
    process_this_frame = True
    image = url_to_image(str(request.data))
    # Resize frame of video for faster processing speed
    small_frame = cv2.resize(image, (0, 0), fx=0.5, fy=0.5)

    # Convert the image from BGR to RGB
    rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    if process_this_frame:
        # Find all the faces and face encodings
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        face_names = []
        for face_encoding in face_encodings:
            # If the faces detected match the known faces
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding, tolerance=0.45)
            name = "Unknown"

            # Just use the first matched one.
            if True in matches:
                first_match_index = matches.index(True)
                name = known_face_names[first_match_index]

            face_names.append(name)

    process_this_frame = not process_this_frame


    results = [];

    for (top, right, bottom, left), name in zip(face_locations, face_names):
        # Scale back up face locations since the frame we detected in was scaled to 1/4 size
        top *= 2
        right *= 2
        bottom *= 2
        left *= 2
        results.append({'x': int(left), 'y': int(top), 'w': int(right-left), 'h': int(bottom-top), "name": name})

    print("result: ")
    print(results)
    print("Found " + str(len(results)) + " faces.")
    response = jsonify(results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

    # for (x,y,w,h) in faces:
    #   results.append({'x':int(x), 'y':int(y), 'w':int(w), 'h':int(h)})

@app.route('/', methods=['GET'])
def root():
    return render_template('index.html')

@app.route('/key', methods=['POST'])
def detect_key():
    image = url_to_image(str(request.data))

    # Resize frame of video for faster processing speed
    big_frame = cv2.resize(image, (0, 0), fx=2, fy=2)

    # extract features from each image
    image_gray = color.rgb2gray(big_frame)
    image_blurring = filters.gaussian(image_gray, sigma=0.5)
    hog_image = feature.hog(image_blurring, orientations=9, pixels_per_cell=(10, 10), cells_per_block=(2, 2),
                            transform_sqrt=True, block_norm="L1")

    # predict the image
    predict_labels = classifier.predict([hog_image])
    predict_results = [];
    predict_results.append({"labels": predict_labels[0]})
    response = jsonify(predict_results)
    response.headers.add('Access-Control-Allow-Origin', '*')
    print("result: ")
    print(predict_labels)

    return response


if __name__ == '__main__':

    app.run(host='127.0.0.1', port=8080, debug=True)