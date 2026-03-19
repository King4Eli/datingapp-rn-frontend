import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Dimensions } from 'react-native';
import { namer } from '../static';


let memoryCache: any = null;
let loadingPromise: Promise<any> | null = null;

export async function xxa_getDeviceSpec(forceRefresh = false) {
  // memory cache
  if (!forceRefresh && memoryCache) {
    console.log("device info from cache");
    return memoryCache;
  }

  // prevent duplicate calls
  if (!forceRefresh && loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    // storage cache
    if (!forceRefresh) {
      const getFromLocalStorage = await AsyncStorage.getItem(namer.storage.deviceSpecs);
      if (getFromLocalStorage) {
        console.log("device info from LocalStorage");
        memoryCache = JSON.parse(getFromLocalStorage);
        return memoryCache;
      }
    }

    // sync base
    const base = {
      Id: DeviceInfo.getDeviceId(),
      Type: DeviceInfo.getDeviceType(),
      Model: DeviceInfo.getModel(),
      Brand: DeviceInfo.getBrand(),
      ScreenDimension: Dimensions.get('screen'),
      Os: `${DeviceInfo.getSystemName()}_${DeviceInfo.getSystemVersion()}`
    };

    // async batch
    const results = await Promise.allSettled([
      DeviceInfo.getDeviceName(),
      DeviceInfo.getDevice(),
      DeviceInfo.isEmulator(),
      DeviceInfo.getManufacturer(),
      DeviceInfo.getSerialNumber(),
      DeviceInfo.getBootloader(),
      DeviceInfo.getFingerprint(),
      DeviceInfo.getUserAgent(),
      DeviceInfo.getBaseOs(),
      DeviceInfo.getBatteryLevel(),
      DeviceInfo.getCarrier(),
      DeviceInfo.getCodename(),
      DeviceInfo.getDeviceToken(),
      DeviceInfo.isPinOrFingerprintSet(),
      DeviceInfo.isMouseConnected(),
      DeviceInfo.getUniqueId(),
    ]);

    const values = results.map(r =>
      r.status === 'fulfilled' ? r.value : null
    );

    const [
      Name, Device, isEmulator, Manufacturer, SerialNumber,
      Bootloader, Fingerprint, UserAgent, BaseOs, BatteryLevel,
      Carrier, Codename, Token, isPinOrFingerprintSet, isMouseConnected,
      InstallationId
    ] = values;

    const full = {
      ...base,
      Name,
      Device,
      isEmulator,
      Manufacturer,
      SerialNumber,
      Bootloader,
      Fingerprint,
      UserAgent,
      BaseOs,
      BatteryLevel,
      Carrier,
      Codename,
      Token,
      isPinOrFingerprintSet,
      isMouseConnected,
      InstallationId
    };

    memoryCache = full;
    await AsyncStorage.setItem(namer.storage.deviceSpecs, JSON.stringify(full));

    return full;
  })();

  return loadingPromise;
}