import { makeStyles, tokens } from '@fluentui/react-components';

export const useReportsAnalyticsStyles = makeStyles({
  container: {
    paddingTop: 0,
    paddingRight: '32px',
    paddingBottom: '32px',
    paddingLeft: '32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    columnGap: '24px',
    rowGap: '12px',
    paddingTop: '28px',
    paddingBottom: '20px',
  },
  pnlGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '12px',
  },
  metricCard: {
    // Win11 card: stroke only, 8px corners, no drop shadow
    padding: '16px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: 'none',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
  },
  sectionCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  headerTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTitle: {
    fontFamily: tokens.fontFamilyBase,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeHero800, // 28px Win11 "Title"
    lineHeight: tokens.lineHeightHero800,
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  headerSubtitle: {
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300, // 14px Body
    lineHeight: tokens.lineHeightBase300,
    margin: '4px 0 0',
    display: 'block',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  salesIcon: {
    color: '#0078D4',
  },
  cogsIcon: {
    color: '#881798',
  },
  expenseIcon: {
    color: '#D13438',
  },
  netProfitIconSuccess: {
    color: '#107C41',
  },
  netProfitIconDanger: {
    color: '#D13438',
  },
  metricLabel: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  netProfitLabelSuccess: {
    fontWeight: 600,
    color: '#107C41',
  },
  netProfitLabelDanger: {
    fontWeight: 600,
    color: '#D13438',
  },
  salesValue: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  cogsValue: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  expenseValue: {
    fontSize: '26px',
    fontWeight: 600,
    color: '#D13438',
    display: 'block',
  },
  refundIcon: {
    color: '#E51937',
  },
  refundValue: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorStatusDangerForeground1,
    display: 'block',
  },
  netProfitValueSuccess: {
    fontSize: '30px',
    fontWeight: 600,
    color: '#107C41',
    display: 'block',
  },
  netProfitValueDanger: {
    fontSize: '30px',
    fontWeight: 600,
    color: '#D13438',
    display: 'block',
  },
  metricSubtext: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginTop: '4px',
  },
  netProfitCardSuccess: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#107C41', borderBottomColor: '#107C41', borderLeftColor: '#107C41', borderRightColor: '#107C41',
  },
  netProfitCardDanger: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#D13438', borderBottomColor: '#D13438', borderLeftColor: '#D13438', borderRightColor: '#D13438',
  },
  sectionTitleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    paddingBottom: '12px',
  },
  sectionTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: '24px',
    display: 'block',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rankMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rankItemName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  rankItemRevenue: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
  },
  ratioStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  ratioHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  ratioLabel: {
    color: tokens.colorNeutralForeground1,
  },
  ratioValueDefault: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  ratioValueSuccess: {
    fontWeight: 600,
    color: '#107C41',
  },
  ratioValueDanger: {
    fontWeight: 600,
    color: '#D13438',
  },
  formulaBox: {
    padding: '12px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  formulaText: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
  },
});

export const useStyles = useReportsAnalyticsStyles;
