import makeReactiveVar from "../utils/makeReactiveVar";
import { getToken } from "../services/authentication.service";
import { isStringObject } from "node:util/types";
import { getMe } from "../services/user.service";

export const authenticatedVar = makeReactiveVar(typeof getToken() === 'string');

// export const userVar = makeReactiveVar(typeof getToken() === 'string' ? getMe() : null);
