# Markdown Blog App

## Built With 🔨

- Express.js
- MongoDB
- EJS
- Bootstrap

## Features

**Markdown support**

You can publish and edit your blog posts in Markdown format.

**Throttling**

When you make three consecutive incorrect sign in attempts within one minute, you will be temporarily banned for 5 minutes.

**Profile**

Users can update their profile pictures and names.

**Interaction**

Users can comment and like the posts.

## How to use

- Clone the repository and fill in the relevant places in the `.env` file or leave as it is.

```
MONGODB_URI=mongodb://mongodb:27017/markdownblogappdb
PORT=3000
```

- Run the following command:

```
docker-compose up
```

## Screenshots

<img src="screenshots/home.png" alt="Home Page">

<hr>

<img src="screenshots/post-interface.png" alt="Post Interface">

<hr>

<img src="screenshots/add-post.png" alt="Add Post">

<hr>

<img src="screenshots/user-profile.png" alt="User Profile">

<hr>

<img src="screenshots/admin-comment-requests.png" alt="Admin Comment Requests">

<hr>

<img src="screenshots/post-comments.png" alt="Post Comments">

## License

This project is released under the MIT License.
