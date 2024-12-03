import { useLocation } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";
import React, { useEffect, useState } from "react";
import { AutoAnnoType, fetchAutoAnnoListData } from "../../services/autoAnno.service";

const AutoAnnoList: React.FC = () => {

  const [autoAnnoData, setData] = useState<AutoAnnoType[] | null>(null);
  // const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation()
  // const comingFrom = location.state?.from?.pathname || "/";
  // const {login, error} = useLogin();


  useEffect(() => {
    const getData = async () => {
      try {
        const result = await fetchAutoAnnoListData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        // setLoading(false);
      }
    };

    getData();
  }, []);


  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Remote Data</h1>
      <ul>
        {autoAnnoData?.map((item) => (
          <li key={item.id}>
            <h2>{item.name}</h2>
            <p>{item.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );


}

export default AutoAnnoList
