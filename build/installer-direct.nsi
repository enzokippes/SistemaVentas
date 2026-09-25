Unicode True
SetCompressor /SOLID lzma

!define PRODUCT_NAME "MiniMercado Kippes"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Kippes"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\MiniMercado Kippes.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKCU"

!include "MUI2.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "C:\Users\enzov\OneDrive\Desktop\SistemaVentas\build\icon.ico"
!define MUI_UNICON "C:\Users\enzov\OneDrive\Desktop\SistemaVentas\build\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\MiniMercado Kippes.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Ejecutar MiniMercado Kippes"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Language
!insertmacro MUI_LANGUAGE "Spanish"

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "C:\Users\enzov\OneDrive\Desktop\SistemaVentas\dist-electron\MiniMercado Kippes Setup 1.0.0.exe"
InstallDir "$LOCALAPPDATA\Programs\MiniMercado Kippes"
InstallDirRegKey HKCU "${PRODUCT_DIR_REGKEY}" ""
RequestExecutionLevel user

VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${PRODUCT_NAME}"
VIAddVersionKey "Comments" "Sistema de Punto de Venta y Control de Stock para Kioscos"
VIAddVersionKey "CompanyName" "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright" "Copyright 2025 ${PRODUCT_PUBLISHER}"
VIAddVersionKey "FileDescription" "${PRODUCT_NAME} Instalador"
VIAddVersionKey "FileVersion" "1.0.0.0"
VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"

Section "Principal" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite ifnewer
  
  File /r "C:\Users\enzov\OneDrive\Desktop\SistemaVentas\dist-electron\win-unpacked\*.*"
  
  CreateDirectory "$SMPROGRAMS\MiniMercado Kippes"
  CreateShortCut "$SMPROGRAMS\MiniMercado Kippes\MiniMercado Kippes.lnk" "$INSTDIR\MiniMercado Kippes.exe" "" "$INSTDIR\MiniMercado Kippes.exe" 0
  CreateShortCut "$SMPROGRAMS\MiniMercado Kippes\Desinstalar.lnk" "$INSTDIR\uninst.exe" "" "$INSTDIR\uninst.exe" 0
  CreateShortCut "$DESKTOP\MiniMercado Kippes.lnk" "$INSTDIR\MiniMercado Kippes.exe" "" "$INSTDIR\MiniMercado Kippes.exe" 0
  
  WriteUninstaller "$INSTDIR\uninst.exe"
  
  WriteRegStr HKCU "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\MiniMercado Kippes.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayIcon" "$INSTDIR\MiniMercado Kippes.exe"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKCU "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
SectionEnd

Section Uninstall
  Delete "$DESKTOP\MiniMercado Kippes.lnk"
  Delete "$SMPROGRAMS\MiniMercado Kippes\MiniMercado Kippes.lnk"
  Delete "$SMPROGRAMS\MiniMercado Kippes\Desinstalar.lnk"
  RMDir "$SMPROGRAMS\MiniMercado Kippes"
  
  RMDir /r "$INSTDIR"
  
  DeleteRegKey HKCU "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKCU "${PRODUCT_DIR_REGKEY}"
  SetAutoClose true
SectionEnd
