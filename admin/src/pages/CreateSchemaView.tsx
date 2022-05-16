import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

import {
  useAuthController,
  useSnackbarController
} from "@camberi/firecms";

import { useNavigate } from "react-router-dom";
import { norm } from '../utils/norm'
import { create } from '../services/schemas'

export function CreateSchemaView() {
  const snackbarController = useSnackbarController();
  const authController = useAuthController();

  const nav = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState(false)


  const createSchema = () => {
    if (!name || (name && !name.match(/[a-zA-Z]+[0-9]*/))) {
      return setError(true)
    }
    create({ name }).then(res => {
      console.log(res)
      setError(false)
      setName('')

      snackbarController.open({
        type: "success",
        message: `Created "${norm(name)}"`
      })
    })
  }

  return (
    <Box
      display="flex"
      width={"100%"}
      height={"100%"}>

      <Box m="auto"
         display="flex"
         flexDirection={"column"}
         alignItems={"center"}
         justifyItems={"center"}>

        <div>Here you can create an additional schema</div>

        {authController.user ?
          <div>Logged in
            as {authController.user.displayName}</div>
          :
          <div>You are not logged in</div>}

        <br/>

        <TextField
          error={error}
          variant="filled"
          placeholder="Name"
          helperText={error ? 'pattern: [a-zA-Z]+[0-9]*' : ''}
          onChange={(ev) => (setError(false), setName(ev.target.value))}/>

        <br/>

        <Button
          onClick={() => createSchema()}
          variant="contained"
          color="primary">
          Create
        </Button>

        <Button
          onClick={() => nav('/', {})}
          color="primary">
          Home
        </Button>

      </Box>
    </Box>
  );
}