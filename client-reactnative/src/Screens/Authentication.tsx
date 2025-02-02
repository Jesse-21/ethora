import Clipboard, {useClipboard} from '@react-native-clipboard/clipboard';
import {useWalletConnect} from '@walletconnect/react-native-dapp';
import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, Text, View} from 'react-native';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {commonColors, textStyles} from '../../docs/config';
import {Button} from '../components/Button';
import {DeleteDialog} from '../components/Modals/DeleteDialog';
import {ScanQrModal} from '../components/Modals/ScanQrModal';
import SecondaryHeader from '../components/SecondaryHeader/SecondaryHeader';
import {showError, showSuccess} from '../components/Toast/toast';
import {httpDelete, httpGet, httpPost} from '../config/apiService';
import {isAddress} from '../helpers/isAddress';
import {useStores} from '../stores/context';
export interface IAuthentication {}

const getMail = (email: string) => {
  if (!email) return '';
  const splittedEmail = email.split('@');
  if (splittedEmail.length) {
    return splittedEmail[1].split('.')[0];
  }
  return '';
};
const walletRoute = '/wallets/ext-wallet/';

export const AuthenticationScreen: React.FC<IAuthentication> = ({}) => {
  const {loginStore, apiStore} = useStores();
  const connector = useWalletConnect();
  const [showQrScan, setShowQrScan] = useState(false);
  const [showRemoveAccount, setShowRemoveAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [accountVerified, setAccountVerified] = useState(false);

  const onMetamaskPress = () => {
    connector.connect({chainId: 1});
  };
  const onQRPress = () => {
    setShowQrScan(true);
  };
  const onRemovePress = () => {
    setShowRemoveAccount(true);
  };

  const getAddress = async () => {
    setLoading(true);
    try {
      const res = await httpGet(
        apiStore.defaultUrl +
          walletRoute +
          loginStore.initialData.walletAddress,
        loginStore.userToken,
      );
      if (res.data.result) {
        setAccount(res.data.result.address);
        setAccountVerified(res.data.result?.verified);
      }
    } catch (error) {
      console.log(error.response);
    }
    setLoading(false);
  };
  const onQRScan = async (e: any) => {
    const data = e.data?.split(':')[1]?.split('@')[0];
    if (!isAddress(data)) {
      showError('Error', 'This doesnt look like a valid Ethereum address');
      setShowQrScan(false);
      return;
    }
    setAccount(data);
    await updateAddress(data);
  };

  const removeAddress = async () => {
    setLoading(true);
    try {
      const res = await httpDelete(
        apiStore.defaultUrl + walletRoute + account,
        loginStore.userToken,
      );
      console.log(res.data);

      showSuccess('Success', 'Your Mainnet address was successfully removed.');
      setAccountVerified(false);
      setAccount('');
    } catch (error) {
      console.log(error);
      showError('Error', 'Something went wrong, please try again');
    }
    setLoading(false);
    setShowRemoveAccount(false);
  };

  const updateAddress = async (address?: string) => {
    try {
      const res = await httpPost(
        apiStore.defaultUrl + walletRoute,
        {
          address: address || account,
        },
        loginStore.userToken,
      );
      console.log(res.data);
      setAccount(res.data.data.address);

      showSuccess('Success', 'Your address was successfully added.');
    } catch (error) {
      console.log(error);
      showError('Error', 'Something went wrong, please try again');
    }
  };

  useEffect(() => {
    getAddress();
    return () => {
      connector.killSession();
    };
  }, []);
  useEffect(() => {
    if (connector.accounts.length) {
      updateAddress(connector.accounts[0]);
    }
  }, [connector.accounts]);
  const renderConnected = () => {
    if (account) {
      return (
        <>
          <View>
            <Text style={styles.title}>Mainnet address</Text>
            <Text style={styles.description}>
              You have confirmed the following address on Ethereum Mainnet:
            </Text>
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(account);
              }}>
              <Text style={styles.boldFont}>{account} 📋</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL('https://etherscan.io/address/' + account)
              }>
              <Text
                style={{
                  color: commonColors.primaryColor,
                  textDecorationLine: 'underline',
                  textAlign: 'center',
                }}>
                (View on Etherscan)
              </Text>
            </TouchableOpacity>
          </View>
          {!accountVerified && (
            <>
              <View style={{marginTop: 20}}>
                <Text style={styles.description}>
                  Use button below if you need to remove your Mainnet address
                  association from your Ethora account.
                </Text>
              </View>
              <View style={styles.buttonBlock}>
                <View style={{width: '50%'}}>
                  <Button
                    onPress={onRemovePress}
                    title="Remove"
                    style={{backgroundColor: 'red', marginBottom: 10}}
                  />
                </View>
              </View>
            </>
          )}
        </>
      );
    }
    return (
      <>
        <View>
          <Text style={styles.title}>Mainnet address</Text>
          <Text style={styles.description}>
            (Optional) confirm your L1 (Ethereum Mainnet) wallet address here if
            you need to export your assets to Mainnet or carry out other L1
            related transactions.
          </Text>
        </View>
        <View style={styles.buttonBlock}>
          <View style={{width: '50%'}}>
            <Button
              loading={loading}
              onPress={onMetamaskPress}
              title="Read from Metamask"
              style={{backgroundColor: '#cc6228', marginBottom: 10}}
            />
            <Button
              loading={loading}
              onPress={onQRPress}
              title="QR Scan"
              style={{backgroundColor: 'lightgrey'}}
              textStyle={{color: 'black'}}
            />
          </View>
        </View>
      </>
    );
  };
  return (
    <View>
      <SecondaryHeader title="Authentication" />
      <View style={{paddingHorizontal: 10}}>
        {renderConnected()}
        <View>
          <Text style={styles.title}>L2 Address</Text>
          <Text style={styles.description}>
            Your local address within Ethora side chain is:
          </Text>
          <TouchableOpacity
            onPress={() =>
              Clipboard.setString(loginStore.initialData.walletAddress)
            }>
            <Text style={styles.boldFont}>
              {loginStore.initialData.walletAddress} 📋
            </Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text style={styles.title}>Ethora Sign On method</Text>
          <Text style={styles.description}>
            Your current sign on method is:
          </Text>
          <Text style={{textAlign: 'center'}}>
            <Text style={[styles.boldFont, {textTransform: 'capitalize'}]}>
              {getMail(loginStore.initialData.email)}
            </Text>{' '}
            (
            {loginStore.initialData.email ??
              loginStore.initialData.username ??
              loginStore.initialData.walletAddress}
            )
          </Text>
          <View style={{marginTop: 20}}>
            <Text style={styles.description}>
              Note: different sign on methods will generate different identities
              in our L2 chain. Please make sure to use the same sign on method
              to operate same profile and assets.
            </Text>
          </View>
        </View>
      </View>
      <ScanQrModal
        closeModal={() => setShowQrScan(false)}
        open={showQrScan}
        onSuccess={onQRScan}
      />
      <DeleteDialog
        title="Would you like to remove your Mainnet address association?"
        description={
          'Note: you can always add an association again using this screen later.'
        }
        cancelButtonTitle={'No, Cancel'}
        deleteButtonTitle={'Yes, Remove'}
        loading={loading}
        onDeletePress={removeAddress}
        onClose={() => setShowRemoveAccount(false)}
        open={showRemoveAccount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontFamily: textStyles.boldFont,
    marginTop: 20,
    color: 'black',
    fontSize: 16,
  },
  description: {
    fontFamily: textStyles.mediumFont,
    color: 'black',
  },
  boldFont: {
    fontWeight: 'bold',
    color: 'black',
  },
  buttonBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
