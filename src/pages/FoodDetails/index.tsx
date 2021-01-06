import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
  quantity: number;
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [total, setTotal] = useState(0);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get<Food>(`foods/${routeParams.id}`);

      const returnedFood = response.data;
      returnedFood.formattedPrice = formatValue(returnedFood.price);
      returnedFood.quantity = 1;
      returnedFood.extras = returnedFood.extras.map(extra => ({
        ...extra,
        quantity: 0,
      }));

      setFood(returnedFood);
    }

    loadFood();
  }, [routeParams]);

  useEffect(() => {
    async function loadFavorite(): Promise<void> {
      try {
        await api.get(`favorites/${routeParams.id}`);
        setIsFavorite(true);
      } catch {
        setIsFavorite(false);
      }
    }

    loadFavorite();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const updatedExtras = food.extras.map(extra =>
      extra.id === id ? { ...extra, quantity: extra.quantity + 1 } : extra,
    );

    setFood({ ...food, extras: updatedExtras });
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const updatedExtras = food.extras.map(extra =>
      extra.id === id && extra.quantity >= 1
        ? { ...extra, quantity: extra.quantity - 1 }
        : extra,
    );

    setFood({ ...food, extras: updatedExtras });
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    const newQuantity = foodQuantity + 1;
    setFood({ ...food, quantity: newQuantity });
    setFoodQuantity(newQuantity);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    if (foodQuantity > 1) {
      const newQuantity = foodQuantity - 1;
      setFood({ ...food, quantity: newQuantity });
      setFoodQuantity(newQuantity);
    }
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (isFavorite) {
      await api.delete(`favorites/${food.id}`);
    } else {
      const newFavorite = {
        ...food,
        formattedPrice: undefined,
        extras: undefined,
        quantity: undefined,
      };

      await api.post('favorites', newFavorite);
    }

    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    if (food.extras) {
      const totalExtras = food.extras.reduce((accumulator, extra) => {
        return accumulator + extra.value * extra.quantity;
      }, 0);

      const calculatedTotal = (Number(food.price) + totalExtras) * foodQuantity;

      setTotal(calculatedTotal);
      return formatValue(calculatedTotal);
    }

    return formatValue(0);
  }, [food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const newOrder = {
      ...food,
      quantity: foodQuantity,
      total,
      formattedPrice: undefined,
    };

    await api.post('orders', newOrder);

    navigation.navigate('Orders');
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {food.extras &&
            food.extras.map(extra => (
              <AdittionalItem key={extra.id}>
                <AdittionalItemText>{extra.name}</AdittionalItemText>
                <AdittionalQuantity>
                  <Icon
                    size={15}
                    color="#6C6C80"
                    name="minus"
                    onPress={() => handleDecrementExtra(extra.id)}
                    testID={`decrement-extra-${extra.id}`}
                  />
                  <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                    {extra.quantity}
                  </AdittionalItemText>
                  <Icon
                    size={15}
                    color="#6C6C80"
                    name="plus"
                    onPress={() => handleIncrementExtra(extra.id)}
                    testID={`increment-extra-${extra.id}`}
                  />
                </AdittionalQuantity>
              </AdittionalItem>
            ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
