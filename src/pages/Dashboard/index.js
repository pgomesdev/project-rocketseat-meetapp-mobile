import React, { useState, useEffect, useMemo } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';
import { FlatList, Alert } from 'react-native';
import { parseISO, format, addDays, subDays } from 'date-fns';
import pt from 'date-fns/locale/pt-BR';
import { HOST_URL } from 'react-native-dotenv';

import api from '../../services/api';

import Meetup from '../../components/Meetup';

import { Container, DateContainer, DateText, NoMeetupText } from './styles';

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState(new Date());
  const [meetups, setMeetups] = useState([]);
  const formattedDate = useMemo(
    () => format(date, "d 'de' MMMM'", { locale: pt }),
    [date]
  );

  function changeDay(isAdd) {
    if (isAdd) {
      const newDate = addDays(date, 1);

      setDate(newDate);
    } else {
      const newDate = subDays(date, 1);

      setDate(newDate);
    }
  }

  async function subscribe(meetupId) {
    try {
      await api.post('/register', {
        meetupId,
      });

      Alert.alert('Inscrição realizada com sucesso');
    } catch (e) {
      Alert.alert(
        'Um erro ocorreu enquanto sua inscrição era feita, tente novamente.'
      );
    }
  }

  async function fetchMoreMeetups() {
    const response = await api.get('/meetups', {
      params: {
        date: format(date, 'yyyy-MM-dd'),
        page,
      },
    });

    const data = response.data.map(meetup => ({
      ...meetup,
      banner: {
        ...meetup.banner,
        url: meetup.banner.url.replace('localhost', HOST_URL),
      },
      formattedDate: format(parseISO(meetup.date), "d 'de' MMMM', às' H'h'", {
        locale: pt,
      }),
    }));

    setMeetups([...meetups, ...data]);
    setPage(page + 1);
  }

  useEffect(() => {
    async function fetchMeetups() {
      try {
        const response = await api.get('/meetups', {
          params: {
            date: format(date, 'yyyy-MM-dd'),
            page: 1,
          },
        });

        const data = response.data.map(meetup => ({
          ...meetup,
          banner: {
            ...meetup.banner,
            url: meetup.banner.url.replace('localhost', HOST_URL),
          },
          formattedDate: format(
            parseISO(meetup.date),
            "d 'de' MMMM', às' H'h'",
            {
              locale: pt,
            }
          ),
        }));

        setMeetups(data);
        setPage(2);
      } catch (e) {
        Alert.alert('Ocorreu um erro enquanto os dados eram carregados.');
      }
    }

    fetchMeetups();
  }, [date]);

  return (
    <Container>
      <DateContainer>
        <Icon
          onPress={() => changeDay(false)}
          name="chevron-left"
          size={30}
          color="#fff"
        />
        <DateText>{formattedDate}</DateText>
        <Icon
          onPress={() => changeDay(true)}
          name="keyboard-arrow-right"
          size={30}
          color="#fff"
        />
      </DateContainer>
      {meetups.length === 0 ? (
        <NoMeetupText>Nenhum meetup encontrado para esta data</NoMeetupText>
      ) : (
        <FlatList
          keyExtractor={meetup => String(meetup.id)}
          data={meetups}
          renderItem={({ item: meetup }) => (
            <Meetup meetup={meetup} subscribe={() => subscribe(meetup.id)} />
          )}
          onEndReached={fetchMoreMeetups}
          onEndReachedThreshold={0.5}
        />
      )}
    </Container>
  );
}

function tabBarIcon({ tintColor }) {
  return <Icon name="format-list-bulleted" size={20} color={tintColor} />;
}

Dashboard.navigationOptions = {
  tabBarIcon,
  tabBarLabel: 'Meetups',
};

tabBarIcon.propTypes = {
  tintColor: PropTypes.string.isRequired,
};
