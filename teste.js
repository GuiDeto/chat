require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer(app);

const CryptoJS = require('crypto-js');

// Encrypt
var ciphertext = CryptoJS.AES.encrypt('teste enc 2', process.env.CRYPT_KEY).toString();
console.log( encodeURIComponent( ciphertext ));
// Decrypt
var bytes  = CryptoJS.AES.decrypt(ciphertext, process.env.CRYPT_KEY);
var originalText = bytes.toString(CryptoJS.enc.Utf8);
 
console.log(originalText); // 'my message'