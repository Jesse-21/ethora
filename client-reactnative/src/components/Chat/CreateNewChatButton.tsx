import React from 'react';
import {Box, HStack, Text, Pressable, View} from 'native-base';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {textStyles} from '../../../docs/config';

export interface ICreateNewChatButton {
  isPressed?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress: () => void;
}

export const CreateNewChatButton: React.FC<ICreateNewChatButton> = ({
  isPressed,
  onPressIn,
  onPressOut,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      bg={isPressed ? 'coolGray.200' : 'transparent'}
      padding={'2'}
      paddingLeft={'4'}
      onPressIn={onPressIn}
      onPressOut={onPressOut}>
      <HStack alignItems={'center'}>
        <Box
          w={hp('5.5%')}
          h={hp('5.5%')}
          bg={'#64BF7C'}
          rounded="full"
          justifyContent={'center'}
          alignItems="center"
          marginRight={2}>
          <AntDesign name="plus" color={'#FFF'} size={hp('4.3%')} />
        </Box>
        <View>
          <Text
            fontSize={hp('2%')}
            fontFamily={textStyles.boldFont}
            _dark={{
              color: 'warmGray.50',
            }}
            color="coolGray.800">
            Create a new room
          </Text>
          <Text
            fontFamily={textStyles.regularFont}
            fontSize={hp('1.5%')}
            color="coolGray.600"
            _dark={{
              color: 'warmGray.100',
            }}>
            Your own room, share with anyone you like
          </Text>
        </View>
      </HStack>
    </Pressable>
  );
};
