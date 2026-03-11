"use client";

import { Amplify } from "aws-amplify";
import { amplifyConfig } from "@/lib/amplify-config";

// Configure Amplify once on the client side
Amplify.configure(amplifyConfig, { ssr: true });

export default function AmplifyConfig() {
  return null;
}
