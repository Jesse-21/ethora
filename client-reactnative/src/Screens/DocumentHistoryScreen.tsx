import React, {Fragment, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, TouchableOpacity} from 'react-native';
import {HStack, Image, ScrollView, Text, View, VStack} from 'native-base';
import SecondaryHeader from '../components/SecondaryHeader/SecondaryHeader';
import AntIcon from 'react-native-vector-icons/AntDesign';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import FastImage from 'react-native-fast-image';
import NftTransactionListTab from '../components/Nft/NftTransactionList';
import {
  audioMimetypes,
  imageMimetypes,
  pdfMimemtype,
  videoMimetypes,
} from '../constants/mimeTypes';
import {useStores} from '../stores/context';
import {transactionURL} from '../config/routesConstants';
import {httpDelete, httpGet} from '../config/apiService';
import {APP_TOKEN, commonColors, textStyles} from '../../docs/config';

import {NftMediaModal} from '../components/NftMediaModal';
import {downloadFile} from '../helpers/downloadFile';
import {IDocument} from '../stores/walletStore';
import AntDesignIcons from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {showError} from '../components/Toast/toast';
import {DeleteDialog} from '../components/Modals/DeleteDialog';
import {ROUTES} from '../constants/routes';

interface DocumentHistoryScreenProps {
  route: {params: {item: IDocument; userWalletAddress: string}};
  navigation: any;
}

export const DocumentHistoryScreen: React.FC<DocumentHistoryScreenProps> = ({
  route,
  navigation,
}) => {
  const {item, userWalletAddress} = route.params;

  const {apiStore, loginStore, walletStore} = useStores();

  const [avatarSource, setAvatarSource] = useState<string | null>(null);
  const [itemTransactions, setItemTransactions] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [modalData, setModalData] = useState<any>({
    visible: false,
    url: '',
    mimetype: '',
    originalName: '',
  });
  useEffect(() => {
    setAvatarSource(item.file.locationPreview);
    getItemTransactionsHistory(userWalletAddress, item._id).then(res => {
      const allTransactions = res.data.items.map(document => {
        if (
          document.from === userWalletAddress &&
          document.from !== document.to
        ) {
          // balance = balance;
          document.balance = document.senderBalance + '/' + document.nftTotal;
        } else if (document.from === document.to) {
          document.balance = document.receiverBalance + '/' + document.nftTotal;
        } else {
          document.balance = document.receiverBalance + '/' + document.nftTotal;
        }

        return document;
      });
      setItemTransactions(
        allTransactions.sort(
          (a: any, b: any) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
    });

    return () => {};
  }, [item]);

  //function to get Item transactions
  const getItemTransactionsHistory = async (
    walletAddress: string,
    nftId: string,
  ) => {
    // let axios = require('axios');
    const url =
      apiStore.defaultUrl +
      transactionURL +
      'walletAddress=' +
      walletAddress +
      '&' +
      'nftId=' +
      nftId;

    const appToken = APP_TOKEN;
    return await httpGet(url, appToken);
  };

  const onPreviewClick = () => {
    setModalData({
      url: item.file.location,
      mimetype: item.file.mimetype,
      visible: true,
      originalName: item.documentName,
    });
  };
  const closeModal = () => {
    setModalData(prev => ({...prev, visible: false, url: ''}));
  };

  const deleteDocument = async () => {
    setLoading(true);
    try {
      const res = await httpDelete(
        apiStore.defaultUrl + '/docs/' + item._id,
        loginStore.userToken,
      );
      await walletStore.getDocuments(loginStore.initialData.walletAddress);
      navigation.navigate(ROUTES.PROFILE);
    } catch (error) {
      console.log(error.response);
      showError('Error', 'Cannot delete document');
    }
    setLoading(false);
  };
  return (
    <Fragment>
      <SecondaryHeader title="Document details" />

      {/* <ScrollView style={styles.container}> */}
      <View style={{...styles.contentContainer, margin: 0}}>
        <VStack paddingTop={5} paddingX={5}>
          <VStack
            justifyContent={'center'}
            alignItems={'center'}
            marginBottom={3}>
            <Text fontFamily={textStyles.boldFont} fontSize={16}>
              {item.documentName}
            </Text>
          </VStack>
          <HStack justifyContent={'flex-start'}>
            <TouchableOpacity
              onPress={onPreviewClick}
              style={{alignItems: 'center'}}>
              {(!!imageMimetypes[item.file.mimetype] ||
                !!pdfMimemtype[item.file.mimetype]) && (
                <FastImage
                  style={styles.tokenImage}
                  source={{
                    uri: item.file.locationPreview,
                    priority: FastImage.priority.normal,
                  }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}

              {videoMimetypes[item.file.mimetype] && (
                <View style={{position: 'relative'}}>
                  <View style={styles.playButton}>
                    <AntIcon
                      name={'playcircleo'}
                      color={'white'}
                      size={hp('5%')}
                    />
                  </View>

                  <FastImage
                    style={styles.tokenImage}
                    source={{
                      uri: item.file.locationPreview,
                      priority: FastImage.priority.normal,
                    }}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </View>
              )}

              {audioMimetypes[item.file.mimetype] && (
                <AntIcon
                  name={'playcircleo'}
                  color={commonColors.primaryColor}
                  size={hp('10%')}
                  // style={{marginRight: 40}}
                />
              )}
            </TouchableOpacity>

            <VStack marginLeft={10} justifyContent={'space-between'}>
              <TouchableOpacity style={styles.actionButton}>
                <AntDesignIcons name="qrcode" size={35} color={'black'} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <AntDesignIcons name="copy1" size={35} color={'black'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setDeleteModalOpen(true)}>
                <MaterialIcons name="delete" size={35} color={'red'} />
              </TouchableOpacity>
            </VStack>
          </HStack>
        </VStack>

        <TouchableOpacity
          disabled={loading}
          // onPress={onMintClick}
          style={{...styles.createButton, height: hp('5%'), borderRadius: 0}}>
          <View
            style={{
              ...styles.alignCenter,
              flex: 1,
            }}>
            {loading ? (
              <ActivityIndicator
                animating={loading}
                size="small"
                color={'white'}
              />
            ) : (
              <Text style={styles.createButtonText}>Provenance</Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={{height: hp('50%')}}>
          {itemTransactions.length ? (
            <NftTransactionListTab
              transactions={itemTransactions}
              walletAddress={userWalletAddress}
            />
          ) : (
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 20,
              }}>
              <Text
                style={{
                  ...styles.textStyle,
                  fontWeight: 'bold',
                  color: commonColors.primaryColor,
                }}>
                This item has no transactions yet...
              </Text>
              <Image
                alt={'no transaction'}
                source={require('../assets/transactions-empty.png')}
                style={styles.noTransactionsImage}
              />
            </View>
          )}
        </View>
      </View>
      {/* </ScrollView> */}
      <NftMediaModal
        closeModal={closeModal}
        modalVisible={modalData.visible}
        mimetype={modalData.mimetype}
        url={modalData.url}
        sharable
        onSharePress={() => downloadFile(modalData.url, modalData.originalName)}
      />
      <DeleteDialog
        loading={loading}
        onDeletePress={deleteDocument}
        title={'Do you really want to delete this document?'}
        description={'Note: this action is irreversible.'}
        onClose={() => setDeleteModalOpen(false)}
        open={deleteModalOpen}
      />
    </Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    margin: 20,
    marginTop: 0,
  },
  tokenImage: {
    width: wp('60%'),
    height: wp('40%'),
    borderRadius: 5,
  },
  justifyBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  alignCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: wp('60%'),
    height: wp('40%'),
    borderRadius: 10,
    borderWidth: 1,
    marginRight: wp('5%'),
    marginLeft: wp('7%'),
    borderColor: 'lightgrey',
  },
  tokenDescriptionContainer: {
    borderRadius: 5,
    marginLeft: 10,
    // flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    width: wp('40%'),
    // height: wp('10%'),
    paddingRight: 10,
  },
  actionButton: {
    marginBottom: 5,
  },
  playButton: {
    position: 'absolute',
    zIndex: 99999,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('60%'),
    height: wp('40%'),
  },
  textStyle: {
    fontFamily: textStyles.lightFont,
    color: 'black',
    // position: 'absolute',
  },
  noTransactionsImage: {
    marginTop: 20,
    resizeMode: 'stretch',
    height: hp('21.50%'),
    width: wp('47.69%'),
  },
  modal: {
    // backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('90%'),
    height: wp('90%'),
  },
  modalImage: {
    width: wp('90%'),
    height: wp('90%'),
    borderRadius: 10,
  },
  createButtonText: {
    fontSize: hp('2%'),
    color: '#fff',
    fontFamily: textStyles.regularFont,
  },
  createButton: {
    backgroundColor: commonColors.primaryColor,
    borderRadius: 5,
    height: hp('7%'),
    marginTop: 20,
  },
});
