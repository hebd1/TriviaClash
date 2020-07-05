# TriviaClash


A multi-player, multi-screen game that uses Socket.IO, Node.js, and the Open Trivia Database API


## To Install

1. Ensure Node.js is installed
2. Clone this repository - `git clone git@github.com:hebd1/TriviaClash.git`
3. Install the dependences:
    1. `cd TriviaClash`
    2. `npm install`
4. Start the server: `npm start`
5. Visit http://your.local.ip.address:8080 in a browser and click CREATE.

## To Play

### Setup
1. Ensure 3 devices are on a local network, or that the application server is accessable by 3 devices.
2. Start the TriviaClash application
3. Visit http://your.ip.address:8080 on a PC, Tablet, SmartTV or other large screen device
4. Click CREATE to initiate a new game session on the host device
5. On a mobile device, visit http://your.ip.address:8080
6. Click JOIN on the mobile device screen (the first player to join will start the game by pressing the 'start' button)
7. Enter a name and the game room code displayed by the game host device, then press start
8. Have your opponent repeat steps 5-7 on another mobile device.

### Gameplay
1. Games consist of four rounds, each centered on a different category.
2. On the large screen (the game Host), player names will be displayed along with their corresponding scores. 
3. On each players' devices, a list of answer options will appear.
4. players who select the correct answer get ten points each question. Incorrect answers get no points.
6. The player with the most points at the end of 4 rounds wins!
