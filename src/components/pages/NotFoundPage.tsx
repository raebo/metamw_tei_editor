import { useLocation } from "react-router-dom";

const NotFoundPage = () => {

  const location = useLocation();
  const state = location.state as { messageKey?: string };

  const errorMap: Record<string, string> = {
    missingLetterId: 'The letter ID is missing.',
    invalidLetterId: 'The letter ID provided is invalid.',
    unauthorizedAccess: 'You do not have permission to access this resource.',
  }

  const errorMessage = state?.messageKey ? errorMap[state.messageKey] : 'Sorry, the page you are looking for does not exist.';

  return (
    <div>
      <h1>404 Not Found</h1>
      <p>{ errorMessage }</p>
    </div>
  )
}

export default NotFoundPage;
