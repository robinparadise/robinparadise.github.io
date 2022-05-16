import { useEffect, useState } from "react";

import { User as FirebaseUser } from "firebase/auth";
import {
  Authenticator,
  buildCollection,
  buildProperty,
  buildSchema,
  EntityReference,
  FirebaseCMSApp,
  NavigationBuilder,
  NavigationBuilderProps,
  CMSView
} from "@camberi/firecms";

import "typeface-rubik";
import "typeface-space-mono";

import { config as firebaseConfig } from './config'
import useSchema, { defaultSchema, localeSchema } from './services/schemas'
import { CreateSchemaView } from './pages/CreateSchemaView'

export default function App() {

  let [navigation, setNavigation]: any = useState(async () => ({collections: []}))
  const schema = useSchema()

  const customViews: CMSView[] = [{
    path: 'create',
    name: '+ Create',
    group: 'Action',
    description: 'Create a new Schema',
    view: <CreateSchemaView/>
  }];


  useEffect(() => {
    const nav = async ({ user, authController }: NavigationBuilderProps) => {

      const schemas = schema.schemaItems.map((schm: any) => {
        return buildSchema({
          ...defaultSchema(schm.name),
          name: schm.name
        })
      })

      return {
        collections: [
          ...schemas.map((schm) => buildCollection({
            path: schm.name,
            schema: schm,
            name: schm.name,
            group: 'Schemas',
            permissions: ({ authController }) => ({
              edit: true,
              create: true,
              // we have created the roles object in the navigation builder
              delete: authController.extra.roles.includes("admin")
            }),
            subcollections: [
              buildCollection({
                name: "Locales",
                path: "locales",
                schema: localeSchema
              })
            ]
          }))
        ],
        views: customViews
      };
    }
    setNavigation(nav)
  }, [schema.schemas])


  useEffect(() => {
    schema.listenSchemas()
  },  [])

  const myAuthenticator: Authenticator<FirebaseUser> = async ({ user, authController }) => {
    // You can throw an error to display a message
    if (user?.email?.includes("flanders")) {
      throw Error("Stupid Flanders!");
    }
    
    console.log("Allowing access to", user?.email);
    // This is an example of retrieving async data related to the user
    // and storing it in the user extra field.
    const sampleUserData = await Promise.resolve({
      roles: ["admin"]
    });
    authController.setExtra(sampleUserData);
    return true;
  };

  return <FirebaseCMSApp
    name={"Admin"}
    authentication={myAuthenticator}
    navigation={navigation}
    firebaseConfig={firebaseConfig}
  />;
}