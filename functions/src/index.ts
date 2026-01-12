// import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { moveAction } from "./engine/actions";

admin.initializeApp();

export { moveAction };
