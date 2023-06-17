# web-application-for-sharing-secrets-anonymously
The application aims to implement user registration, login, and authentication functionalities, allowing users to access and share secrets with each other. The secrets can be submitted and viewed on the "secrets" page, which requires users to be authenticated and have a verified email address. The secrets of users are diplayed in such a way  such that the most recent posted secret is displayed at the top.

Overall, this application provides a platform for user authentication, secret sharing, and email verification, allowing users to securely interact and share their secrets with others.

It is a  Node.js application that uses Express.js as a framework for creating a web server. It incorporates various dependencies such as Passport.js for user authentication, Mongoose for MongoDB database connectivity, and Nodemailer for sending email notifications.

## Folder Structure

- Secrets
   - public
       - css
          - bootstrap-social.css
          - styles-register-success.css
          - styles.css
   - views
      - partials
         - header.ejs
         - footer.ejs
      - home.ejs
      - login.ejs
      - register.ejs
      - registration-successful.ejs
      - secrets.ejs
      - submit.ejs
   - app.js
   - date.js
   
   ## Brief description of each file
   
   - **bootstrap-social.css** - CSS file that provides styling for social media buttons and icons in conjunction with the Bootstrap framework. The *btn-social btn-google* class is used to display Google icon within the button.
   - **styles-register-success.css** - CSS file for styling the registration-successful page for username-password based registration. A message gets displayed on the page, suggesting the user to verify the email for accessing the secrets page.
   - **styles.css** - CSS file for styling different pages of the web application.
   - **header.ejs** - It is the header file which forms the header of each page in the web application.
   - **footer.ejs** - It is the footer file which forms the footer of each page in the web application.
   - **home.ejs** - It is the home page of the web application where two buttons are available, the first button takes to a registration page and second button takes to the login page.
   - **login.ejs** -  It is the login page of the web application where the user can login either by using username-password method or by using google login method.
   - **register.ejs** - It is the registration page of the web application where the user can register either by using username-password method or by using google login method.
   - **registration-successful.ejs** - This page displays that user has been successfully registered. It also displays a message suggesting the user to verify his/her email for accessing the secrets page.
   - **secret.ejs** - This is the main page of the web application where all the secrets of different users are being displayed anonymously. More recent secrets are displayed at the top of the page.
   - **submit.ejs** - This page allows the user to submit a secret anonymously.
