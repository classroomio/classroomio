import { ScaleTypes, Alignments } from '@carbon/charts-svelte';
import type { BarChartOptions, PieChartOptions } from '@carbon/charts-svelte';

export const pieOptions: PieChartOptions = {
  resizable: true,
  legend: {
    alignment: Alignments.CENTER
  },
  pie: {
    alignment: Alignments.CENTER
  },
  height: '400px'
};

export const barOptions: BarChartOptions = {
  axes: {
    left: {
      mapsTo: 'value'
    },
    bottom: {
      mapsTo: 'group',
      scaleType: ScaleTypes['LABELS']
    }
  },
  height: '400px'
};

export function getChartOptions(isLoading: boolean) {
  const barOptions: BarChartOptions = {
    axes: {
      left: {
        mapsTo: 'value'
      },
      bottom: {
        mapsTo: 'group',
        scaleType: ScaleTypes['LABELS']
      }
    },
    height: '400px'
  };

  const pieOptions: PieChartOptions = {
    resizable: true,
    legend: {
      alignment: Alignments.CENTER
    },
    pie: {
      alignment: Alignments.CENTER
    },
    height: '400px'
  };

  if (isLoading) {
    barOptions.data = {
      loading: true
    };
    pieOptions.data = {
      loading: true
    };
  }

  return {
    barOptions,
    pieOptions
  };
}
