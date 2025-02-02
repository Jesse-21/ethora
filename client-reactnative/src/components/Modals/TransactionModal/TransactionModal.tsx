/*
Copyright 2019-2022 (c) Dappros Ltd, registered in England & Wales, registration number 11455432. All rights reserved.
You may not use this file except in compliance with the License.
You may obtain a copy of the License at https://github.com/dappros/ethora/blob/main/LICENSE.
Note: linked open-source libraries and components may be subject to their own licenses.
*/

import React, {useEffect, useState} from 'react';
import {StyleSheet, ActivityIndicator, TouchableOpacity, Alert} from 'react-native';
import {modalTypes} from '../../../constants/modalTypes';
import PrivacyPolicy from '../../PrivacyPolicy';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  coinsMainName,
  commonColors,
  itemsTransfersAllowed,
  textStyles,
} from '../../../../docs/config';
import SendItem from './SendItem';
import {useStores} from '../../../stores/context';
import {
  FlatList,
  HStack,
  Input,
  Pressable,
  Text,
  View,
  VStack,
} from 'native-base';
import AssetItem from './AssetItem';
import TokenTransfer from './TokenTransfer';
import {useNavigation} from '@react-navigation/native';
import {
  banUser,
  blacklistUser,
  createNewRoom,
  getUserRoomsStanza,
  roomConfig,
  sendInvite,
  setOwner,
  subscribeToRoom,
} from '../../../xmpp/stanzas';
import {underscoreManipulation} from '../../../helpers/underscoreLogic';
import {ROUTES} from '../../../constants/routes';
import {TransferModalButton} from './TransferModalButton';
import ReportAndBlockButton from './ReportAndBlockButton';
import QRCodeGenerator from '../../QRCodeGenerator';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {NftListItem} from '../../Transactions/NftListItem';
import Modal from 'react-native-modal';
import {alpha} from '../../../helpers/aplha';
import {SceneMap, TabBar, TabView} from 'react-native-tab-view';

interface TransactionModalProps {
  type: string | undefined;
  extraData?: any;
  closeModal?: any;
  isVisible?: boolean;
}

export const InviteFriendsScreen = ({navigation}) => {
  const {loginStore} = useStores();

  return <></>;
};

const TransactionModal = (props: TransactionModalProps) => {
  const {type, extraData, closeModal, isVisible} = props;

  const [tokenAmount, setTokenAmount] = useState(null);
  const [tokenState, setTokenState] = useState({type: null, amnt: null});
  const [selectedItem, setSelectedItem] = useState({});
  const [displayItems, setDisplayItems] = useState(false);
  const [displayCollections, setDisplayCollections] = useState(false);
  const [loading, setLoading] = useState(false);

  const [allowedEnterCustomAmount, setAllowedEnterCustomAmount] =
    useState(false);
  const [customTransferAmount, setCustomTransferAmount] = useState('');
  const {walletStore, loginStore, apiStore, chatStore} = useStores();
  const {userToken, initialData} = loginStore;

  const navigation = useNavigation();
  const clearState = () => {
    closeModal();
    setCustomTransferAmount('');
    setLoading(false);
    // setAllowedEnterCustomAmount(false);
  };
  const renderNftItems = () => {
    const getItemSelected = (selectedItem, item) => {
      if (item.tokenType === 'NFMT') {
        return (
          selectedItem.nfmtType + selectedItem.contractAddress ===
          item.nfmtType + item.contractAddress
        );
      }
      return selectedItem.contractAddress === item.contractAddress;
    };
    return (
      <FlatList
        data={walletStore.nftItems.filter(item => !item.external)}
        renderItem={(e, index) => (
          <NftListItem
            assetUrl={e.item.imagePreview || e.item.nftFileUrl}
            name={e.item.tokenName}
            assetsYouHave={e.item.balance}
            totalAssets={e.item.total}
            onClick={() => setSelectedItem(e.item)}
            itemSelected={getItemSelected(selectedItem, e.item)}
            nftId={e.item.nftId}
            mimetype={e.item.nftMimetype}
            traitsEnabled={false}
            item={e.item}
            index={index}
          />
        )}
        nestedScrollEnabled={true}
        keyExtractor={(item, index) => index.toString()}
      />
    );
  };
  const renderNftCollection = () => {
    const getItemSelected = (selectedItem, item) => {
      if (item.tokenType === 'NFMT') {
        return (
          selectedItem.nfmtType + selectedItem.contractAddress ===
          item.nfmtType + item.contractAddress
        );
      }
      return selectedItem.contractAddress === item.contractAddress;
    };
    return (
      <FlatList
        data={walletStore.collections}
        renderItem={(e, index) => (
          <NftListItem
            assetUrl={e.item.imagePreview || e.item.nftFileUrl}
            name={e.item.tokenName}
            assetsYouHave={e.item.balance}
            totalAssets={e.item.total}
            onClick={() => setSelectedItem(e.item)}
            itemSelected={getItemSelected(selectedItem, e.item)}
            nftId={e.item.nftId}
            mimetype={e.item.nftMimetype}
            traitsEnabled={false}
            item={e.item}
            index={index}
          />
        )}
        nestedScrollEnabled={true}
        keyExtractor={(item, index) => index.toString()}
      />
    );
  };
  useEffect(() => {
    if (isVisible) {
      setAllowedEnterCustomAmount(false);
    }
  }, [isVisible]);

  const tokenTransferFunc = async amt => {
    clearState();
    if (amt <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    const receiverName = extraData.name;
    const receiverMessageId = extraData.message_id;
    const senderName = extraData.senderName;
    const tokenList = walletStore.balance;
    const fromWalletAddress = initialData.walletAddress;
    const walletAddress = extraData.walletFromJid
      ? extraData.walletFromJid
      : '0x7D0ec8C3A9ae0173c6807065A88cbE45f32D9e4e';
    let walletBalance = 0;
    const bodyData = {
      toWallet: walletAddress,
      amount: amt,
      tokenId: 'ERC20',
      tokenName: coinsMainName,
    };

    tokenList.map(item => {
      if (item.tokenName === coinsMainName) {
        if (item.balance.hasOwnProperty('_hex')) {
          walletBalance = parseInt(item.balance._hex, 16);
        } else {
          walletBalance = item.balance;
        }
      }
    });
    if (walletBalance) {
      if (+amt <= walletBalance) {
        await walletStore.transferTokens(
          bodyData,
          loginStore.userToken,
          fromWalletAddress,
          senderName,
          receiverName,
          receiverMessageId,
          false,
        );
        // this.setState({tokenState: {type: 'sent', amnt: amt}});
        setTokenState({type: 'sent', amnt: amt});
      } else {
        alert('Not enough token');
      }
    } else {
      alert('You do not have enough ' + coinsMainName);
    }
  };
  const transferCollection = async () => {
    clearState();
    setLoading(true);
    const receiverName = extraData.name;
    // const receiverMessageId = extraData.message_id;
    const senderName = extraData.senderName;

    // console.log(item, 'flatitemsss');

    // const amt = this.state.tokenAmount;
    const receiverWalletAddress = extraData.walletFromJid;

    const bodyData = {
      toAddress: receiverWalletAddress,
      contractAddress: selectedItem?.contractAddress,
    };
    await walletStore.transferCollection(
      bodyData,
      senderName,
      receiverName,
      selectedItem.tokenName + ' (Collection)',
    );
    setLoading(false);

    setDisplayItems(false);
    setDisplayCollections(false);
    setSelectedItem({});
    closeModal();
  };
  const itemTransferFunc = async () => {
    clearState();
    const receiverName = extraData.name;
    // const receiverMessageId = extraData.message_id;
    const senderName = extraData.senderName;
    const amountToSend = 1;

    // console.log(item, 'flatitemsss');

    const fromWalletAddress = initialData.walletAddress;
    // const amt = this.state.tokenAmount;
    const walletAddress = extraData.walletFromJid
      ? extraData.walletFromJid
      : '0x7D0ec8C3A9ae0173c6807065A88cbE45f32D9e4e';
    const bodyData = {
      nftId: selectedItem.nftId,
      receiverWallet: walletAddress,
      amount: 1,
      tokenName: selectedItem.tokenName,
    };

    const nfmtBodyData = {
      to: walletAddress,
      id: selectedItem.nfmtType,
      amount: 1,
      contractAddress: selectedItem?.contractAddress,
      isNfmt: true,
      tokenName: selectedItem.tokenName,
      nftId: selectedItem.nftId,

    };

    if (selectedItem.balance) {
      //   this.setState({tokenState: {type: 'sent', amnt: amt}});
      // setTokenState({type: 'sent', amnt: amountToSend});

      // await this.props.transferTokens(
      //   bodyData,
      //   token,
      //   fromWalletAddress,
      //   senderName,
      //   receiverName,
      //   null,
      //   true,
      // );
      await walletStore.transferTokens(
        selectedItem?.balances?.length ? nfmtBodyData : bodyData,
        userToken,
        fromWalletAddress,
        senderName,
        receiverName,
        null,
        true,
      );
      const tokenList = walletStore.balance.filter(
        item => item.tokenType === 'NFT' && item.balance > 0,
      );

      setTokenState({type: 'sent', amnt: amountToSend});
      setDisplayItems(false);
      setSelectedItem({});
    } else {
      alert(
        item.name
          ? 'You do not have enough ' + item.name
          : 'Please choose the item',
      );
    }
  };

  const Seperator = () => {
    return <View style={styles.seperator} />;
  };

  const onDirectMessagePress = async () => {
    const otherUserWalletAddress = extraData?.walletFromJid;
    const myWalletAddress = initialData.walletAddress;
    const combinedWalletAddress = [myWalletAddress, otherUserWalletAddress]
      .sort()
      .join('_');

    const roomJid =
      combinedWalletAddress.toLowerCase() +
      apiStore.xmppDomains.CONFERENCEDOMAIN;
    const combinedUsersName = [
      initialData.firstName,
      extraData.name.split(' ')[0],
    ]
      .sort()
      .join(' and ');

    const myXmppUserName = underscoreManipulation(myWalletAddress);
    createNewRoom(
      myXmppUserName,
      combinedWalletAddress.toLowerCase(),
      chatStore.xmpp,
    );
    setOwner(
      myXmppUserName,
      combinedWalletAddress.toLowerCase(),
      chatStore.xmpp,
    );
    roomConfig(
      myXmppUserName,
      combinedWalletAddress.toLowerCase(),
      {roomName: combinedUsersName},
      chatStore.xmpp,
    );
    subscribeToRoom(roomJid, myXmppUserName, chatStore.xmpp);

    navigation.navigate(ROUTES.CHAT, {
      chatJid: roomJid,
      chatName: combinedUsersName,
    });
    chatStore.toggleShouldCount(false);

    setTimeout(() => {
      sendInvite(
        underscoreManipulation(myWalletAddress),
        roomJid.toLowerCase(),
        underscoreManipulation(otherUserWalletAddress),
        chatStore.xmpp,
      );
    }, 3000);

    clearState();
  };

  const handleBanUser = () => {
    const bannedUserWalletAddres = underscoreManipulation(
      extraData?.walletFromJid,
    );
    const senderWalletAddres = underscoreManipulation(
      initialData.walletAddress,
    );
    const roomJID = extraData.chatJid;

    Alert.alert('Ban', 'This will ban user', 
    [
      {
        text: "Cancel",
        onPress: () => {
          clearState();
          closeModal();
        },
        style: "cancel"
      },
      { text: "OK", onPress: () =>     {
        banUser(
        roomJID,
        senderWalletAddres,
        bannedUserWalletAddres,
        chatStore.xmpp,
        )
        clearState();
      }
    }
    ]
    )


  };
  const onBlackListPress = () => {
    const bannedUserWalletAddres = underscoreManipulation(
      extraData?.walletFromJid,
    );
    const senderWalletAddres = underscoreManipulation(
      initialData.walletAddress,
    );

    blacklistUser(senderWalletAddres, bannedUserWalletAddres, chatStore.xmpp);

    clearState();
    closeModal();
  };
  const setModalType = () => {
    if (type === modalTypes.PRIVACYPOLICY) {
      return (
        <Modal isVisible={isVisible}>
          <View style={styles.centeredView}>
            <View style={styles.privacyPolicyMainContainer}>
              <View style={styles.privacyPolicyBodySection}>
                {/* {PrivacyPolicy()} */}
                <PrivacyPolicy />
              </View>
              <View style={styles.privacyPolicyButtonSection}>
                <TouchableOpacity
                  style={styles.privacyAgree}
                  onPress={() => {
                    extraData.register();
                    clearState();
                  }}>
                  <Text style={styles.privacyAgreeTextStyle}>Agree</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.privacyCancel}
                  onPress={() => clearState()}>
                  <Text style={styles.privacyCancelTextStyle}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    if (type === modalTypes.LOADING) {
      return (
        <View>
          <Modal animationType="fade" transparent={true} visible={isVisible}>
            <View styles={styles.centeredView}>
              <Text>Loading profile information...</Text>
              <ActivityIndicator
                animating={isVisible}
                size="small"
                color={commonColors.primaryColor}
              />
            </View>
          </Modal>
        </View>
      );
    }
    if (displayCollections) {
      return (
        <View>
          <Modal
            onBackdropPress={() => setDisplayCollections(false)}
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            onBackButtonPress={closeModal}
            isVisible={displayCollections}>
            <View style={[styles.centeredView]}>
              <View
                style={[
                  {
                    backgroundColor: 'white',
                    height: hp('50%'),
                    width: wp('100%'),
                    padding: 0,
                    margin: 0,
                    paddingTop: 7,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <View style={styles.tokenTransferContainer}>
                  {renderNftCollection()}

                  {!loading ? (
                    <SendItem
                      title={'Send Collections'}
                      onPress={transferCollection}
                    />
                  ) : (
                    <ActivityIndicator size={30} />
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </View>
      );
    }
    if (displayItems) {
      return (
        <View>
          <Modal
            onBackdropPress={() => {setDisplayItems(false) 
              clearState()}}
            animationIn={'slideInUp'}
            animationOut={'slideOutDown'}
            style={{justifyContent:"center", alignItems:"center"}}
            onBackButtonPress={closeModal}
            isVisible={displayItems}>
              <View
                style={[
                  {
                    backgroundColor: 'white',
                    height: hp('40%'),
                    width: wp('90%'),
                    padding: 0,
                    margin: 0,
                    paddingTop: 7,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}>
                <View style={[styles.tokenTransferContainer]}>
                  {renderNftItems()}

                  {<SendItem title={'Send Items'} onPress={itemTransferFunc} />}
                </View>
              </View>
          </Modal>
        </View>
      );
    }

    if (type === modalTypes.TOKENTRANSFER) {
      const modalPosition =
        tokenState.type === 'receive' ? 'center' : 'flex-end';
      const modalBackgroundColor =
        tokenState.type === 'receive' ? '#ffff' : 'rgba(0,0,0,0.5)';
      const modalViewHeight =
        tokenState.type === 'receive' ? hp('30%') : hp('20%');
      const modalViewBackgroundColor =
        tokenState.type === 'receive' ? commonColors.primaryColor : 'white';
      return (
        <Modal
          onBackdropPress={clearState}
          animationIn={'slideInUp'}
          animationOut={'slideOutDown'}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onDismiss={closeModal}
          isVisible={isVisible}>
          <View
            w={wp('70%')}
            // h={hp('100%')}
            bg={'#ffff'}
            shadow="2"
            justifyContent={'center'}
            alignItems={'center'}
            borderRadius={10}
            padding={2}>
            {allowedEnterCustomAmount ? (
              <VStack>
                <Text
                  style={{
                    color: commonColors.primaryColor,
                    fontFamily: textStyles.semiBoldFont,
                    textAlign: 'center',
                  }}>
                  Enter Your Amount
                </Text>
                <View style={{paddingHorizontal: 5, marginVertical: 10}}>
                  <Input
                    maxLength={15}
                    keyboardType="numeric"
                    fontFamily={textStyles.lightFont}
                    fontSize={hp('1.6%')}
                    color={'black'}
                    value={customTransferAmount}
                    onChangeText={setCustomTransferAmount}
                    placeholder="Enter transfer amount"
                    placeholderTextColor={commonColors.primaryDarkColor}
                    borderColor={commonColors.primaryDarkColor}
                    backgroundColor={alpha(commonColors.primaryDarkColor, 0.1)}
                  />
                </View>
                <TransferModalButton
                  title={'Send'}
                  onPress={() => tokenTransferFunc(customTransferAmount)}
                />
              </VStack>
            ) : (
              <>
                <View style={styles.tokenTransferContainer}>
                  <TokenTransfer
                    name={extraData.name}
                    tokenAmount={tokenAmount}
                    tokenTransferFunc={tokenTransferFunc}
                    onCustomAmountPress={() =>
                      setAllowedEnterCustomAmount(true)
                    }
                  />
                </View>

                {walletStore.nftItems.filter(item => !item.external).length >
                  0 &&
                  itemsTransfersAllowed && (
                    <>
                      <Seperator />

                      <SendItem
                        title={'Send Items'}
                        onPress={() => {
                          console.log('clickd');
                          setDisplayItems(true);
                        }}
                      />
                    </>
                  )}
                {!!walletStore.collections.length && (
                  <>
                    <Seperator />

                    <SendItem
                      title={'Send Collections'}
                      onPress={() => {
                        setDisplayCollections(true);
                      }}
                    />
                  </>
                )}
                <Seperator />
                <TransferModalButton
                  title={'Direct Message'}
                  onPress={onDirectMessagePress}
                />
                {chatStore.roomRoles[extraData.chatJid] !== 'participant' && (
                  <View style={{width: wp('70%'), alignItems: 'center'}}>
                    <Seperator />
                    <ReportAndBlockButton
                      onPress={handleBanUser}
                      text={'Kick this user'}
                      style={{backgroundColor: '#a32f2b'}}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        textAlign: 'center',
                        lineHeight: 10,
                        // marginTop: 5,
                        color: '#5A5A5A',
                      }}>
                      Remove user from this room.
                    </Text>
                  </View>
                )}
              </>
            )}
           {!allowedEnterCustomAmount && <View style={{width: wp('70%'), alignItems: 'center'}}>
              <Seperator />
              <ReportAndBlockButton
                onPress={onBlackListPress}
                text={'Block this user'}
                style={{backgroundColor: commonColors.primaryColor}}
              />

              <Text
                style={{
                  fontSize: 10,
                  textAlign: 'center',
                  lineHeight: 10,
                  // marginTop: 5,
                  paddingHorizontal: 1,
                  color: '#5A5A5A',
                }}>
                Stop seeing this user.
              </Text>
            </View>}
          </View>
        </Modal>
      );
    }

    if (type === modalTypes.GENERATEQR) {
      return (
        <Modal
          onBackdropPress={() => clearState(false)}
          animationIn={'slideInUp'}
          animationOut={'slideOutDown'}
          isVisible={isVisible}>
          <View
            w={wp('90%')}
            h={wp('100%')}
            bg={'#ffff'}
            shadow="2"
            borderRadius={10}
            padding={2}>
            <HStack>
              <View padding={2} flex={0.5}>
                <Text
                  fontFamily={textStyles.boldFont}
                  fontSize={hp('2.2%')}
                  color={'#000'}>
                  Share {extraData.mode === 'chat' ? 'Chatroom' : 'Profile'}
                </Text>
              </View>
              <Pressable
                padding={2}
                flex={0.5}
                alignItems={'flex-end'}
                onPress={() => clearState()}>
                <MaterialIcons name="close" color={'black'} size={hp('3.5%')} />
              </Pressable>
            </HStack>
            <View style={{flex: 1}}>
              <QRCodeGenerator
                removeBaseUrl={extraData.removeBaseUrl?extraData.removeBaseUrl:false}
                close={() => clearState()}
                shareKey={extraData.link}
              />
            </View>
          </View>
        </Modal>
      );
    }
  };

  return <View>{setModalType()}</View>;
};

export default TransactionModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // marginTop: 22,
  },
  privacyPolicyMainContainer: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    height: hp('70%'),
    width: wp('80%'),
  },
  privacyPolicyBodySection: {
    flex: 0.9,
    width: '100%',
    padding: hp('2%'),
  },
  privacyPolicyButtonSection: {
    flex: 0.1,
    width: '100%',
    padding: hp('2%'),
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  privacyAgree: {
    height: hp('4%'),
    width: wp('15%'),
    backgroundColor: commonColors.secondaryColor,
    margin: hp('1.5%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyAgreeTextStyle: {
    fontFamily: textStyles.semiBoldFont,
    fontSize: hp('1.4%'),
    color: '#ffffff',
  },
  privacyCancel: {
    height: hp('4%'),
    width: wp('15%'),
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyCancelTextStyle: {
    fontFamily: textStyles.semiBoldFont,
    fontSize: hp('1.4%'),
    textDecorationLine: 'underline',
  },
  modalView: {
    margin: 20,
    // height:hp('60%'),
    width: wp('70%'),
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tokenTransferContainer: {
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seperator: {
    width: wp('40%'),
    height: 0,
    borderWidth: 1,
    borderColor: '#A1A1A1',
    margin: hp('1.5%'),
  },
});
