import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Calendar, User, Building, FileText, RefreshCw, Download } from 'lucide-react';
import { useCoverageService, medicarePartConfig, formatDate } from './CoverageService';

// Utility functions for status display
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'inactive':
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
};

const getStatusBadge = (status) => {
  const variant = status?.toLowerCase() === 'active' ? 'default' : 
                 status?.toLowerCase() === 'inactive' ? 'destructive' : 'secondary';
  return (
    <Badge variant={variant} className="capitalize">
      {status || 'Unknown'}
    </Badge>
  );
};

// Extension Info Component
const ExtensionInfo = ({ extensions }) => {
  const variableLabels = {
    'ms_cd': 'Medicare Status',
    'a_trm_cd': 'Termination Status',
    'esrd_ind': 'ESRD Status',
    'rfrnc_yr': 'Reference Year',
    'orec': 'Original Reason for Entitlement',
    'crec': 'Current Reason for Entitlement',
    'dual_stus_cd': 'Dual Status Code',
    'state_cd': 'State Code'
  };

  const filteredExtensions = Object.entries(extensions)
    .filter(([key]) => variableLabels[key]);

  if (filteredExtensions.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Additional Details
      </h4>
      <div className="bg-gray-50 p-3 rounded-lg">
        {filteredExtensions.map(([key, value]) => (
          <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-sm font-medium text-gray-600">
              {variableLabels[key]}:
            </span>
            <span className="text-sm text-gray-900">
              {typeof value === 'object' ? (value.display || value.value) : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Coverage Details Component
const CoverageDetails = ({ coverage }) => {
  return (
    <div className="border-l-4 border-blue-200 pl-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon(coverage.status)}
          <div>
            <h3 className="font-semibold text-lg">{coverage.payor}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              ID: {coverage.subscriberId || coverage.id}
            </p>
          </div>
        </div>
        {getStatusBadge(coverage.status)}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Coverage Details
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Relationship:</span>
              <span className="text-gray-900 capitalize">{coverage.relationship}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Last Updated:</span>
              <span className="text-gray-900">{formatDate(coverage.lastUpdated)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Plan Information
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            {coverage.coverageTypes.length > 0 ? (
              <div className="space-y-2">
                {coverage.coverageTypes.map((type, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium text-gray-600">{type.type}:</span>
                    <Badge variant="outline" className="ml-2">
                      {type.value}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No specific plan details</p>
            )}
          </div>
        </div>
      </div>

      <ExtensionInfo extensions={coverage.extensions} />
    </div>
  );
};

// Medicare Part Card Component
const MedicarePartCard = ({ coverages, partKey }) => {
  const config = medicarePartConfig[partKey];
  if (!config) return null;
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${config.color}`}></div>
            <div>
              <CardTitle className="text-xl">{config.name}</CardTitle>
              <CardDescription className="mt-1">
                {config.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {coverages.map((coverage, index) => (
          <CoverageDetails key={coverage.id || index} coverage={coverage} />
        ))}
      </CardContent>
    </Card>
  );
};

// Load Coverage Button Component
const LoadCoverageButton = ({ onLoad, loading }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Load Coverage Information</h2>
      <button
        onClick={onLoad}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading Coverage Data...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Load All Coverage
          </div>
        )}
      </button>
    </div>
  );
};

// Error Display Component
const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="font-medium text-red-800">Error loading coverage data:</span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </CardContent>
    </Card>
  );
};

// Empty State Component
const EmptyState = ({ loading }) => {
  if (loading) return null;

  return (
    <Card>
      <CardContent className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Coverage Data Loaded</h3>
        <p className="text-gray-500 mb-4">
          Click the button above to load your Medicare coverage information for all parts.
        </p>
      </CardContent>
    </Card>
  );
};

// Main Coverage Display Component
const CoverageDisplay = () => {
  const {
    processedCoverage,
    loading,
    error,
    fetchEobData,
    eobData
  } = useCoverageService();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Medicare Coverage Information</h1>
        <p className="text-gray-600">Comprehensive overview of your Medicare coverage across all parts</p>
      </div>

      {/* Load Coverage Button */}
      <LoadCoverageButton onLoad={fetchEobData} loading={loading} />

      {/* Error Display */}
      <ErrorDisplay error={error} />

      {/* Coverage Display */}
      {Object.entries(processedCoverage).map(([partKey, coverages]) => 
        coverages.length > 0 ? (
          <MedicarePartCard key={partKey} coverages={coverages} partKey={partKey} />
        ) : null
      )}

      {/* Empty State */}
      {!eobData && !loading && <EmptyState loading={loading} />}
    </div>
  );
};

export default CoverageDisplay;