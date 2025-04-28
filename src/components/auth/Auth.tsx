import React from 'react';
import {Button, Stack, TextField} from "@mui/material";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthProps {
    submitLabel: string;
    onSubmit: (
      credentials: { email: string, password: string },
    ) => Promise<void>;
    error?: string;
}

const Auth = ( { submitLabel, onSubmit, error } : AuthProps) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [data] = useState("")
    const navigate = useNavigate();
    const comingFrom= useLocation().state?.from?.pathname || "/";

    return (
        <Stack spacing={3} sx={
            {
                height: "100vh",
                maxWidth: {
                    xs: "70%",
                    md: "30%"
                },
                margin: "0 auto",
                justifyContent: "center"
            }
        }>
          <TextField
              type={"email"}
              label={"Email"}
              variant={"outlined"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={!!error}
              helperText={error}
          />
          <TextField
              type={"password"}
              label={"Password"}
              variant={"outlined"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={!!error}
              helperText={error}
          />
          <Button variant={"contained"} onClick={() => {
            onSubmit({email, password})
            navigate(comingFrom, { replace: true })
            }
          }>
              {submitLabel}
          </Button>
        </Stack>
    )
}

export default Auth;
