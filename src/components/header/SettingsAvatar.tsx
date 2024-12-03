import { Avatar } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

function stringToColor(string: String) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name: String) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
  };
}

interface SettingsAvatarProps {
  nameUser: {
    first_name: String;
    last_name: String;
  } | null
}

const SettingsAvatar = ( { nameUser }: SettingsAvatarProps) => {
  const _nameUser = nameUser !== null ? nameUser : { first_name: new String(), last_name: new String() }
  return (
    <>
      <Avatar alt="Remy Sharp" src="" { ...stringAvatar(`${_nameUser.first_name} ${_nameUser.last_name}` )}  >
      </Avatar>
      {/*<p>*/}
      {/*  {`${_user.firstName} ${_user.lastName}`}*/}
      {/*</p>*/}
      {/*<p>*/}
      {/*  {`${_nameUser.first_name} ${_nameUser.last_name}`}*/}
      {/*</p>*/}
    </>
    // <Avatar alt="Remy Sharp" src="" { ...stringAvatar(`${_nameUser.first_name} ${_nameUser.last_name}` )}  />
  )
}

export default SettingsAvatar;